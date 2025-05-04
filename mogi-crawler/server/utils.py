import re

province_dict = {
    "Hồ Chí Minh": "TPHCM",
    "Thành phố Hồ Chí Minh": "TPHCM",
    "Thanh pho Ho Chi Minh": "TPHCM",
    "TP. Hồ Chí Minh": "TPHCM",
    "TP.Hồ Chí Minh": "TPHCM",
    "TP Hồ Chí Minh": "TPHCM",
    "TPHCM": "TPHCM",
    "TP HCM": "TPHCM",
    "Thành Phố Hồ Chí Minh": "TPHCM",
    "HCM": "TPHCM",
    "TP. HCM": "TPHCM",
    "tphcm": "TPHCM",
    "An Giang": "An Giang",
    "Bà Rịa - Vũng Tàu": "Bà Rịa - Vũng Tàu",
    "Bắc Giang": "Bắc Giang",
    "Bắc Kạn": "Bắc Kạn",
    "Bạc Liêu": "Bạc Liêu",
    "Bắc Ninh": "Bắc Ninh",
    "Bến Tre": "Bến Tre",
    "Bình Định": "Bình Định",
    "Bình Dương": "Bình Dương",
    "Bình Phước": "Bình Phước",
    "Bình Thuận": "Bình Thuận",
    "Cà Mau": "Cà Mau",
    "Cần Thơ": "Cần Thơ",
    "Cao Bằng": "Cao Bằng",
    "Đà Nẵng": "Đà Nẵng",
    "Đắk Lắk": "Đắk Lắk",
    "Đắk Nông": "Đắk Nông",
    "Điện Biên": "Điện Biên",
    "Đồng Nai": "Đồng Nai",
    "Đồng Tháp": "Đồng Tháp",
    "Gia Lai": "Gia Lai",
    "Hà Giang": "Hà Giang",
    "Hà Nam": "Hà Nam",
    "Hà Nội": "Hà Nội",
    "Hà Tĩnh": "Hà Tĩnh",
    "Hải Dương": "Hải Dương",
    "Hải Phòng": "Hải Phòng",
    "Hậu Giang": "Hậu Giang",
    "Hòa Bình": "Hòa Bình",
    "Hưng Yên": "Hưng Yên",
    "Khánh Hòa": "Khánh Hòa",
    "Kiên Giang": "Kiên Giang",
    "Kon Tum": "Kon Tum",
    "Lai Châu": "Lai Châu",
    "Lâm Đồng": "Lâm Đồng",
    "Lạng Sơn": "Lạng Sơn",
    "Lào Cai": "Lào Cai",
    "Long An": "Long An",
    "Nam Định": "Nam Định",
    "Nghệ An": "Nghệ An",
    "Ninh Bình": "Ninh Bình",
    "Ninh Thuận": "Ninh Thuận",
    "Phú Thọ": "Phú Thọ",
    "Phú Yên": "Phú Yên",
    "Quảng Bình": "Quảng Bình",
    "Quảng Nam": "Quảng Nam",
    "Quảng Ngãi": "Quảng Ngãi",
    "Quảng Ninh": "Quảng Ninh",
    "Quảng Trị": "Quảng Trị",
    "Sóc Trăng": "Sóc Trăng",
    "Sơn La": "Sơn La",
    "Tây Ninh": "Tây Ninh",
    "Thái Bình": "Thái Bình",
    "Thái Nguyên": "Thái Nguyên",
    "Thanh Hóa": "Thanh Hóa",
    "Thừa Thiên Huế": "Thừa Thiên Huế",
    "Tiền Giang": "Tiền Giang",
    "TP Hồ Chí Minh": "TPHCM",
    "Trà Vinh": "Trà Vinh",
    "Tuyên Quang": "Tuyên Quang",
    "Vĩnh Long": "Vĩnh Long",
    "Vĩnh Phúc": "Vĩnh Phúc",
    "Yên Bái": "Yên Bái",
    "TP. Thủ Đức": "Thủ Đức",
}


def standardize_province(province):
    print("PROVINCE", province)
    print("STANDARDIZED PROVINCE", province_dict.get(province, province))
    return province_dict.get(province, province)


def standardize_district(district):
    # district = district.lower()
    district = re.sub(r"Quận|Huyện|Thị xã|Thị trấn", "", district)
    district = district.strip()
    return district


def standardize_ward(ward):
    # ward = ward.lower()
    ward = re.sub(r"Xã|Phường|Thị trấn|Thị xã", "", ward)
    ward = ward.strip()
    return ward
