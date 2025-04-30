"use server";
export default async function getProperties(searchParams) {
  const queryString = "?" + new URLSearchParams(searchParams);

  const posts = await getPropertiesWithQueryString(queryString);

  return posts;
}

export async function getPropertiesWithQueryString(queryString) {
  const baseURL = `${process.env.RENTAL_SERVICE_BACKEND_ENDPOINT}/posts`;
  const res = await fetch(baseURL + queryString, {
    cache: "no-cache",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }

  const { posts } = (await res.json()).data;
  return posts;
}
