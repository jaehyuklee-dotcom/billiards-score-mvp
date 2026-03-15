import { NextResponse } from "next/server";

export type KakaoPlace = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string | null;
};

const KAKAO_API_KEY_ENV = "NEXT_PUBLIC_KAKAO_API_KEY";
// 카카오 로컬 API는 REST API 키 사용 필수 (JavaScript 키 아님)
const AUTH_PREFIX = "KakaoAK ";

function safeErrorDetails(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { message: err.message, name: err.name, stack: err.stack };
  }
  return { raw: String(err) };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  // Vercel 환경: NEXT_PUBLIC_ 미로드 시 KAKAO_API_KEY fallback
  const apiKey =
    process.env.NEXT_PUBLIC_KAKAO_API_KEY?.trim() || process.env.KAKAO_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Kakao API key not configured",
        details: {
          envVars: [KAKAO_API_KEY_ENV, "KAKAO_API_KEY"],
          hint: "Vercel 환경 변수에 REST API 키 설정 필요",
        },
      },
      { status: 500 }
    );
  }

  if (!query) {
    return NextResponse.json(
      { error: "query is required", message: "당구장 이름을 입력하세요" },
      { status: 400 }
    );
  }

  // Authorization: "KakaoAK " + key (공백 정확히 하나)
  const authHeader = `${AUTH_PREFIX}${apiKey}`;
  const searchPhrase = `${query} 당구장`;
  const encodedQuery = encodeURIComponent(searchPhrase);
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodedQuery}&size=15`;

  const requestHeaders = {
    Authorization: authHeader,
    Accept: "application/json",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  // Vercel 로그용: 요청 직전 디버깅 (API 키는 마스킹)
  const authPreview =
    authHeader.length > 12
      ? `KakaoAK ${authHeader.slice(8, 12)}****${authHeader.slice(-4)}`
      : authHeader
        ? "KakaoAK [설정됨]"
        : "(없음)";
  const headersForLog = {
    ...requestHeaders,
    Authorization: authPreview,
  };
  console.log("[Kakao Search] === 요청 직전 ===");
  console.log("[Kakao Search] API Key 존재 여부:", !!apiKey);
  console.log("[Kakao Search] 요청 헤더 전체:", JSON.stringify(headersForLog));
  console.log("[Kakao Search] 요청 URL:", url);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: requestHeaders,
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error("[Kakao API error]", res.status, responseText);
      let kakaoErrorMsg: string | undefined;
      let kakaoRaw: Record<string, unknown> | undefined;
      try {
        const parsed = JSON.parse(responseText) as {
          error?: string;
          error_message?: string;
          msg?: string;
          message?: string;
          [key: string]: unknown;
        };
        kakaoErrorMsg =
          parsed.error_message ?? parsed.error ?? parsed.msg ?? parsed.message;
        kakaoRaw = parsed;
      } catch {
        // non-JSON 응답
      }
      const errorBody = {
        error: "Kakao API request failed",
        message: kakaoErrorMsg ?? (responseText || `HTTP ${res.status}`),
        kakao_error_message: kakaoErrorMsg,
        kakao_response: kakaoRaw ?? responseText,
        details: {
          status: res.status,
          statusText: res.statusText,
          hint:
            res.status === 403
              ? "REST API 키 사용 여부 및 카카오 개발자센터 앱 설정 확인"
              : undefined,
        },
      };
      return NextResponse.json(errorBody, { status: res.status });
    }

    const data = JSON.parse(responseText) as {
      documents?: Array<{
        id: string;
        place_name: string;
        address_name: string;
        road_address_name?: string | null;
      }>;
    };

    const places: KakaoPlace[] = (data.documents ?? []).map((doc) => ({
      id: doc.id,
      place_name: doc.place_name,
      address_name: doc.address_name,
      road_address_name: doc.road_address_name ?? null,
    }));

    return NextResponse.json(places);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Kakao search error]", errMsg);
    return NextResponse.json(
      {
        error: "Search failed",
        message: errMsg,
        details: safeErrorDetails(err),
      },
      { status: 500 }
    );
  }
}
