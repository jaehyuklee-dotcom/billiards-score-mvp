import { NextResponse } from "next/server";

export type KakaoPlace = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const apiKey = process.env.NEXT_PUBLIC_KAKAO_API_KEY?.trim();

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
    const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    url.searchParams.set("query", `${query} 당구장`);
    url.searchParams.set("size", "15");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Kakao API error:", res.status, text);
      return NextResponse.json(
        { error: "Kakao API request failed" },
        { status: res.status }
      );
    }

    const data = (await res.json()) as {
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
    console.error("Kakao search error:", err);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
