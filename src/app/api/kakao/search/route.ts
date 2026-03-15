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
  const rawKey = process.env.NEXT_PUBLIC_KAKAO_API_KEY;
  const apiKey = rawKey?.trim();

  // 서버 사이드 로그: 환경 변수 로드 여부 확인
  const keyPreview = apiKey ? `${apiKey.slice(0, 4)}****${apiKey.slice(-4)}` : "NOT_SET";
  const keyLength = apiKey?.length ?? 0;
  console.log(
    `[Kakao Search] env=${KAKAO_API_KEY_ENV} loaded=${!!apiKey} preview=${keyPreview} length=${keyLength}`
  );

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Kakao API key not configured",
        details: { envVar: KAKAO_API_KEY_ENV, hint: "카카오 개발자센터에서 REST API 키 확인" },
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
  const hasCorrectSpace = authHeader.startsWith("KakaoAK ") && authHeader.length > 8;
  console.log(
    `[Kakao Search] Authorization format: prefix=KakaoAK length=${authHeader.length} valid=${hasCorrectSpace}`
  );

  try {
    const searchPhrase = `${query} 당구장`;
    const encodedQuery = encodeURIComponent(searchPhrase);
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodedQuery}&size=15`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json;charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error("[Kakao API error]", res.status, responseText);
      let errorBody: { error?: string; message?: string; details?: Record<string, unknown> } = {
        error: "Kakao API request failed",
        message: responseText || `HTTP ${res.status}`,
        details: {
          status: res.status,
          statusText: res.statusText,
          bodyPreview: responseText.slice(0, 200),
          hint:
            res.status === 403
              ? "REST API 키 사용 여부 및 카카오 개발자센터 앱 설정 확인"
              : undefined,
        },
      };
      try {
        const parsed = JSON.parse(responseText) as {
          message?: string;
          error?: string;
          msg?: string;
        };
        errorBody = {
          error: parsed.error ?? parsed.msg ?? "Kakao API error",
          message: parsed.message ?? parsed.error ?? parsed.msg ?? responseText,
          details: errorBody.details,
        };
      } catch {
        // non-JSON 응답이면 responseText 유지
      }
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
