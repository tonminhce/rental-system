import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from typing import List, Dict
from app.database.chat_history_service import get_db_connection
import json
from app.database.product_service import init_properties_table
# from app.database.order_service import init_order_table
# from app.database.wallet_service import init_wallet_table, create_wallet
from decimal import Decimal

SAMPLE_PROPERTIES = [
    {
        "id": "1",
        "name": "💥Phòng bancon thoáng sáng ngay Đại học HUTECH Bình Thạnh",
        "description": "Xin Giới thiệu với bạn 1 Căn Phòng Mới, cửa sổ thoáng mátĐịa chỉ: 213 Nguyễn Gia Trí, Phường 25, Quận Bình ThạnhGần Trường ĐH HuTech, ĐH Ngoại Thương, Giao Thông Vận Tải=======TÒA NHÀ MỚI XÂY, SẠCH SẼ, NỘI THẤT SANG TRỌNG+ Thiết kế HIỆN ĐẠI,+ Máy lạnh, Gác, Nệm, Tủ áo quần, Kệ bếp nấu ăn, Tủ lạnh,+ Máy giặt cho tiện nghi giặt giũ.+ Sân phơi đồ riêng.=======AN NINH:_ Nhà được giám sát bằng hệ thống camera 24h._ Nằm trong khu dân cư cao cấp_ Ra vào bằng thẻ từ, đảm bảo an toàn và không lo mất mát.=======GIÁ THUÊ BẤT NGỜChỉ với 5 triệu/tháng bạn đã sở hữu ngay 1 nơi ở tuyệt vờiBạn còn chừng chừ gì nữa hãy liên hệ Anh Ngọc để hẹn giờ xem phòng trước khi đến kẻo hết.Hẹn gặp lại bạn tại Căn Phòng tiện nghi tuyệt vời này ./.",
        "price": 5000000,    
        "specifications": {
            "property_type": "room",
            "transaction_type": "rent",
            "status": "Available",
            "bedrooms": 0,
            "bathrooms": 0,
            "area": 30,
            "owner_name": "Ngo Ngọc",
            "owner_contact": "0906379188",
            "address": {
                "street": "Nguyễn Gia Trí",
                "ward": "25",
                "district": "Bình Thạnh",
                "province": "TPHCM"
            },
            "coordinates": {
                "latitude": 106.71934127999998,
                "longitude": 10.80611706
            }
        }
    },
    {
        "id": "2",
        "name": "Phòng mới, giá rẻ, sẵn nội thất. Ngay mặt tiền Ng Thái Sơn, Sát VINCOM",
        "description": "Phòng mới cho thuê, thoáng mát, sạch sẽ đường Nguyễn Thái Sơn, đi bộ 1 phút đến VINCOM. Tất cả các phòng đều có ban công, cửa sổ thoáng mát cả ngày, lấy ánh sáng tự nhiên vào phòng tiết kiệm điện.Vị trí sát ngay mặt tiền an ninh, xe hơi đỗ tận cửa về khuya an toàn.Trang bị sẵn các thiết bị:+ GIƯỜNG, NỆM+ MÁY LẠNH+ KỆ BẾP+ TỦ QUẦN ÁO+ BÀN, GHẾ SOFA+ WIFI CÁP QUANG TỐC ĐỘ CAO+ CAMERA QUAN SÁT 24/24Vị trí thuận tiện qua quận Bình Thạnh,Phú Nhuận. 5 phút tới sân bay. Chợ, siêu thị 24/24, Bách Hoá Xanh gần nhàThuận tiện di chuyển đến các trường Cao Đẳng Kinh Tế Đối Ngoại, Học Viện Hàng Không, HUTECH,....Giờ giấc tự do 24/24 dành cho các bạn đi làmĐịa chỉ: 566/3 Nguyễn Thái Sơn, Phường 5, Gò VấpGiá: 2.5 – 3.9 triệuSDT liên hệ: 0901901116",
        "price": 2500000,
        "specifications": {
            "property_type": "room",
            "transaction_type": "rent",
            "status": "Available",
            "bedrooms": 0,
            "bathrooms": 0,
            "area": 20,
            "owner_name": "Mo Gi",
            "owner_contact": "0935534687",
            "address": {
                "street": "Nguyễn Thái Sơn",
                "ward": "5",
                "district": "Gò Vấp",
                "province": "TPHCM"
            },
            "coordinates": {
                "latitude": 106.69274139000004,
                "longitude": 10.829872605
            }
        }
    },
    {
        "id": "3",
        "name": "Cho thuê Căn hộ RichStar Khu 1 96m² 3PN 3WC Full Nội Thất",
        "description": "CẦN CHO THUÊ.Căn hộ RICHSTAR NOVALANDDiện tích 96m2 bao gồm 3PN và 3WCNội thất đầy đủThuận tiện đi lại giữa các địa điểm trong Thành PhốTiện ích: Hồ bơi - Gym (Miễn phí), Công viên, Khu vui chơi trẻ em, Shophouse, Spa,...LH: 0395.091.574(Hỗ trợ thuê NHANH theo yêu cầu của khách hàng)",
        "price": 15000000,
        "specifications": {
            "property_type": "room",
            "transaction_type": "rent",
            "status": "Available",
            "bedrooms": 3,
            "bathrooms": 3,
            "area": 96,
            "owner_name": "Đức Trí",
            "owner_contact": "0395091574",
            "address": {
                "street": "Hòa Bình",
                "ward": "Hiệp Tân",
                "district": "Tân Phú",
                "province": "TPHCM"
            },
            "coordinates": {
                "latitude": 106.62949149999997,
                "longitude": 10.7711102
            }
        }
    },
    {
        "id": "4",
        "name": "Cho thuê Chung cư Celadon City 80m² 3PN full Nội Thất Giá chỉ 11 triệu",
        "description": "Căn hộ chung cư cho thuêDự án: Celadon City ( Khu Ruby ).Giá: 11 tr/ thángDiện tích 80m² 3PN-2WCNội thất: FullTiện ích đầy đủLH: 0395.091.574 (Gặp Trí) để được tư vấn và hướng dẫn xem nhà cụ thể ạ.",
        "price": 11000000,
        "specifications": {
            "property_type": "room",
            "transaction_type": "rent",
            "status": "Available",
            "bedrooms": 3,
            "bathrooms": 2,
            "area": 80,
            "owner_name": "Đức Trí",
            "owner_contact": "0395091574",
            "address": {
                "street": "Đường CN1",
                "ward": "Sơn Kỳ",
                "district": "Tân Phú",
                "province": "TPHCM"
            },
            "coordinates": {
                "latitude": 106.61977386500007,
                "longitude": 10.80487442
            }
        }
    }
]

# Sample users with initial balance
# SAMPLE_USERS = [
#     {
#         "user_id": "user1",
#         "balance": Decimal("200000000")  # 200 triệu
#     },
#     {
#         "user_id": "user2",
#         "balance": Decimal("150000000")  # 150 triệu
#     },
#     {
#         "user_id": "user3",
#         "balance": Decimal("300000000")  # 300 triệu
#     }
# ]

def seed_properties():
    """Seed products into database"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Clear existing products
            cur.execute("TRUNCATE TABLE product CASCADE")
            
            # Insert new products
            for product in SAMPLE_PROPERTIES:
                specs = product["specifications"]
                cur.execute(
                    """
                    INSERT INTO product (
                        id, name, description, price,
                        property_type, transaction_type, status,
                        bedrooms, bathrooms, area,
                        owner_name, owner_contact,
                        street, ward, district, province,
                        latitude, longitude
                    )
                    VALUES (
                        %s, %s, %s, %s,
                        %s, %s, %s,
                        %s, %s, %s,
                        %s, %s,
                        %s, %s, %s, %s,
                        %s, %s
                    )
                    """,
                    (
                        product["id"],
                        product["name"],
                        product["description"],
                        product["price"],
                        specs["property_type"],
                        specs["transaction_type"],
                        specs["status"],
                        specs["bedrooms"],
                        specs["bathrooms"],
                        specs["area"],
                        specs["owner_name"],
                        specs["owner_contact"],
                        specs["address"]["street"],
                        specs["address"]["ward"],
                        specs["address"]["district"],
                        specs["address"]["province"],
                        specs["coordinates"]["latitude"],
                        specs["coordinates"]["longitude"]
                    )
                )
        conn.commit()

# def seed_wallets():
#     """Seed user wallets into database"""
#     for user in SAMPLE_USERS:
#         create_wallet(user["user_id"], user["balance"])

def init_and_seed_database():
    """Initialize tables and seed data"""
    print("Initializing tables...")
    init_properties_table()
    # init_order_table()
    # init_wallet_table()
    
    print("Seeding properties...")
    seed_properties()
    
    # print("Seeding user wallets...")
    # seed_wallets()
    
    print("Database initialization and seeding completed!")

if __name__ == "__main__":
    print("Running database seed directly...")
    try:
        init_and_seed_database()
        print("Seed completed successfully!")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc() 