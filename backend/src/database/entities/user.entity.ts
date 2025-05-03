import { Table, Column, Model, DataType, HasMany, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Message } from './message.entity';
import { FavoriteList } from './favorite-list.entity';
import { ChatRoomMember } from './chat-room-member.entity';
import { Role } from './role.entity'
import { Booking } from './booking.entity';

@Table({
  tableName: 'users',
  underscored: true,
})
export class User extends Model<User> {
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
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  email: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
  })
  phone: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
  })
  password: string;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'role_id',
  })
  roleId: number;

  // Relationships
  @BelongsTo(() => Role)
  role: Role;

  @HasMany(() => Message, 'sender_id')
  messages: Message[];

  @HasMany(() => FavoriteList, 'user_id')
  favorites: FavoriteList[];

  @HasMany(() => ChatRoomMember, 'user_id')
  chatRoomMembers: ChatRoomMember[];
  
  @HasMany(() => Booking, 'userId')
  bookings: Booking[];
}