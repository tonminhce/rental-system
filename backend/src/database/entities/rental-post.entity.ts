import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { RentalImage } from './rental-image.entity';
import { FavoriteList } from './favorite-list.entity';
import { Booking } from './booking.entity';

@Table({
  tableName: 'rental_posts',
  underscored: true,
})
export class RentalPost extends Model<RentalPost> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  price: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  area: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'property_type',
  })
  propertyType: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'transaction_type',
  })
  transactionType: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'source_url',
  })
  sourceUrl: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  province: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  district: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  ward: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  street: string;

  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: true,
  })
  latitude: number;

  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: true,
  })
  longitude: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'displayed_address',
  })
  displayedAddress: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'active',
  })
  status: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  bedrooms: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  bathrooms: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'contact_name',
  })
  contactName: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'contact_phone',
  })
  contactPhone: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'post_url',
  })
  postUrl: string;

  @HasMany(() => RentalImage, 'rental_id')
  images: RentalImage[];

  @HasMany(() => FavoriteList, 'rental_id')
  favorites: FavoriteList[];

  @HasMany(() => Booking, 'postId')
  bookings: Booking[];
} 