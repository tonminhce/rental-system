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
    value: "rooming_house",
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
    value: "appartment",
    label: "Appartment",
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

export const PROPERTY_TYPES = {
  house: {
    value: "house",
    label: "House",
    viLabel: "Nhà riêng",
    Icon: HomeOutlined,
  },
  room: {
    value: "room",
    label: "Rooming House",
    viLabel: "Phòng trọ",
    Icon: HolidayVillageOutlined,
  },
  dormitory: {
    value: "dormitory",
    label: "Dormitory",
    viLabel: "Ký túc xá",
    Icon: HomeWorkOutlined,
  },
  appartment: {
    value: "appartment",
    label: "Appartment",
    viLabel: "Căn hộ chung cư",
    Icon: ApartmentOutlined,
  },
  land: {
    value: "land",
    label: "Land",
    viLabel: "Đất",
    Icon: YardOutlined,
  },
  office: {
    value: "office",
    label: "Office",
    viLabel: "Văn phòng",
    Icon: BusinessCenterOutlined,
  },
  villa: {
    value: "villa",
    label: "Villa",
    viLabel: "Biệt thự",
    Icon: VillaOutlined,
  },
  warehouse: {
    value: "warehouse",
    label: "Warehouse",
    viLabel: "Kho, nhà xưởng",
    Icon: WarehouseOutlined,
  },
};
