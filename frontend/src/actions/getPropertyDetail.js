"use server";
export default async function getPropertyDetail(slug) {
  const baseURL = `${process.env.RENTAL_SERVICE_BACKEND_ENDPOINT}/posts/${slug}`;
  const res = await fetch(baseURL, {
    next: { revalidate: 20 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }

  const { post } = (await res.json()).data;
  return post;
}
