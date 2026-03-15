import { NextResponse } from "next/server";

export type KakaoPlace = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string | null;
};

const KAKAO_API_KEY_ENV = "NEXT_PUBLIC_KAKAO_API_KEY";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const apiKey = process.env.NEXT_PUBLIC_KAKAO_API_KEY?.trim();

  // 환경 변수 디버깅 (앞 4자리만 출력)
  const keyPreview = apiKey ? `${apiKey.slice(0, 4)}****` : "NOT_SET";
  console.log(`[Kakao Search] env ${KAKAO_API_KEY_ENV} loaded: ${keyPreview}`);

  if (!apiKey) {
    return NextResponse.json(
      { error: "Kakao API key not configured" },
      { status: 500 }
    );
  }

  if (!query) {
    return NextResponse.json(
      { error: "query is required", message: "당구장 이름을 입력하세요" },
      { status: 400 }
    );
  }

  try {
    const searchPhrase = `${query} 당구장`;
    const encodedQuery = encodeURIComponent(searchPhrase);
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodedQuery}&size=15`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json;charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error("[Kakao API error]", res.status, responseText);
      let errorBody: { error?: string; message?: string } = {
        error: "Kakao API request failed",
        message: responseText || `HTTP ${res.status}`,
      };
      try {
        const parsed = JSON.parse(responseText) as { message?: string; error?: string; msg?: string };
        errorBody = {
          error: parsed.error ?? parsed.msg ?? "Kakao API error",
          message: parsed.message ?? parsed.error ?? parsed.msg ?? responseText,
        };
      } catch {
        // non-JSON 응답이면 responseText 사용
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
      { error: "Search failed", message: errMsg },
      { status: 500 }
    );
  }
}
