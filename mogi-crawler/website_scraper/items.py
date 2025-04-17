from dataclasses import dataclass

@dataclass
class PostItem:
    title: str
    address: str
    description: str
    price: str
    post_url: str

    owner_name: str
    owner_contact: str

    thumbnail: str
    images: list[str]

    area: str
    bedrooms: int
    bathrooms: int

    coordinates: list[float]
