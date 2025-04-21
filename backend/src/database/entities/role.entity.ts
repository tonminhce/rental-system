import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { User } from './user.entity';

@Table({
  tableName: 'roles',
  underscored: true,
})
export class Role extends Model<Role> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description: string;

  @HasMany(() => User)
  users: User[];
}
