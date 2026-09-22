import {
  ApartmentOutlined,
  BusinessCenterOutlined,
  HomeWorkOutlined,
  VillaOutlined,
  WarehouseOutlined,
  YardOutlined,
  HomeOutlined,
  HolidayVillageOutlined,
} from "@mui/icons-material";

export const PROPERTY_TYPE_DETAILS = [
  {
    value: "all",
    label: "All",
    viLabel: "Tất cả nhà đất",
  },
  {
    value: "house",
    label: "House",
    viLabel: "Nhà riêng",
    Icon: HomeOutlined,
  },
  {
    value: "room",
    label: "Rooming House",
    viLabel: "Phòng trọ",
    Icon: HolidayVillageOutlined,
  },
  {
    value: "dormitory",
    label: "Dormitory",
    viLabel: "Ký túc xá",
    Icon: HomeWorkOutlined,
  },
  {
    value: "apartment",
    label: "Apartment",
    viLabel: "Căn hộ chung cư",
    Icon: ApartmentOutlined,
  },
  {
    value: "land",
    label: "Land",
    viLabel: "Đất",
    Icon: YardOutlined,
  },
  {
    value: "office",
    label: "Office",
    viLabel: "Văn phòng",
    Icon: BusinessCenterOutlined,
  },
  {
    value: "villa",
    label: "Villa",
    viLabel: "Biệt thự",
    Icon: VillaOutlined,
  },
  {
    value: "warehouse",
    label: "Warehouse",
    viLabel: "Kho, nhà xưởng",
    Icon: WarehouseOutlined,
  },
];

export const PROPERTY_TYPE_VALUES = PROPERTY_TYPE_DETAILS.map((propType) => propType.value);

export const PROPERTY_TYPES = Object.fromEntries(
  PROPERTY_TYPE_DETAILS.filter(({ value }) => value !== "all").map((propType) => [
    propType.value,
    propType,
  ]),
);
