import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { RentalPost } from './rental-post.entity';

@Table({
  tableName: 'rental_images',
  underscored: true
})
export class RentalImage extends Model<RentalImage> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @ForeignKey(() => RentalPost)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'rental_id'
  })
  rentalId: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  url: string;

  // Relationships will be handled in the entity but not in migrations
  @BelongsTo(() => RentalPost)
  rental: RentalPost;
} 