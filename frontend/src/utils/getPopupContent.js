export default function getPopupContent(property) {
  return `
    <div style="font-family: 'Roboto', Arial, sans-serif; width: 234px; max-width: 234px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.15); border: 1px solid #000000; background-color: white; margin: 0; padding: 0;">
      <div style="position: relative;">
        <img src="${property.image}" alt="${property.name}" style="width:100%; height:130px; object-fit: cover;">
        <div style="position: absolute; bottom: 8px; right: 8px; background-color: rgba(234, 67, 53, 0.9); border-radius: 4px; padding: 4px 8px;">
          <span style="color: white; font-weight: bold; font-size: 13px;">${property.price == 0 ? "Giá thoả thuận" : property.price + " triệu/tháng"}</span>
        </div>
      </div>
      
      <div style="padding: 10px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.4; color: #333; font-weight: 600;">${property.displayed_address}</h3>
        
        <div style="display:flex; justify-content: space-between; margin-bottom:10px; background-color: #f8f9fa; padding: 7px; border-radius: 6px; border: 1px solid #e0e0e0;">
          <div style="display:flex; align-items:center; gap:4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4285F4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"></path><path d="M2 19h20"></path><path d="M4 15v4"></path><path d="M20 15v4"></path><path d="M12 4v9"></path><path d="M2 11h20"></path></svg>
            <span style="font-size: 12px; font-weight: 500;">${property.bedrooms || 0} pn</span>
          </div>
          
          <div style="display:flex; align-items:center; gap:4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34A853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16"></path><path d="M4 10h16"></path><path d="M10 2v4"></path><path d="M2 13a8 8 0 0 1 8-8"></path><path d="M22 13a8 8 0 0 0-8-8"></path><path d="m6 14-2 8"></path><path d="m18 14 2 8"></path></svg>
            <span style="font-size: 12px; font-weight: 500;">${property.bathrooms || 0} wc</span>
          </div>
          
          <div style="display:flex; align-items:center; gap:4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBBC05" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2h20v20H2z"></path><path d="M6 6h.01"></path><path d="M18 6h.01"></path><path d="M6 18h.01"></path><path d="M18 18h.01"></path></svg>
            <span style="font-size: 12px; font-weight: 500;">${property.area || 0} m²</span>
          </div>
        </div>
        
        <a href="/posts/${property.id}" target="_blank" style="display: block; text-align: center; padding: 7px 0; background-color: #FF5722; color: white; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 12px; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(255, 87, 34, 0.3);">Xem chi tiết</a>
      </div>
    </div>
    `;
}
