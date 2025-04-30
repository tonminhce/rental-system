export default function getPopupContent(property) {
  return `
    <img src="${property.image}" alt="${property.name}" style="width:100%;max-height:100px;object-fit: cover;">
    <h2 style="color:red">${property.price == 0 ? "Giá thoả thuận" : property.price + " triệu/tháng"} </h2>
    <p>${property.displayed_address}</p>
    <a arget="_blank" href="/posts/${property.id}">Xem chi tiết</a>
    `;
}
