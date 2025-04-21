import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { RentalImage } from './rental-image.entity';
import { FavoriteList } from './favorite-list.entity';

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
    type: DataType.DATE,
    allowNull: true,
    field: 'published_date',
  })
  publishedDate: Date;

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
    type: DataType.DECIMAL(10, 8),
    allowNull: true,
  })
  latitude: number;

  @Column({
    type: DataType.DECIMAL(11, 8),
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

  // Relationships will be handled in the entity but not in migrations
  @HasMany(() => RentalImage, 'rental_id')
  images: RentalImage[];

  @HasMany(() => FavoriteList, 'rental_id')
  favorites: FavoriteList[];
} 