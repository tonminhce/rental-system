import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.entity';
import { RentalPost } from './rental-post.entity';

@Table({
  tableName: 'favorite_lists',
  underscored: true
})
export class FavoriteList extends Model<FavoriteList> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id'
  })
  userId: number;

  @ForeignKey(() => RentalPost)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'rental_id'
  })
  rentalId: number;

  // Relationships will be handled in the entity but not in migrations
  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => RentalPost)
  rental: RentalPost;
} 