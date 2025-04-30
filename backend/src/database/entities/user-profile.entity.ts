import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Unique } from 'sequelize-typescript';
import { User } from './user.entity';

@Table({
    tableName: 'user_profiles',
    underscored: true,
})
export class UserProfile extends Model<UserProfile> {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    id: number;

    // Relation 1-1 with User
    @ForeignKey(() => User)
    @Unique
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'user_id',
    })
    userId: number;

    @BelongsTo(() => User)
    user: User;

    // Fields profile
    @Column(DataType.ENUM('Male', 'Female'))
    gender: 'Male' | 'Female';

    @Column(DataType.ENUM('Clean', 'Normal', 'Messy'))
    lifestyle: 'Clean' | 'Normal' | 'Messy';

    @Column(DataType.BOOLEAN)
    pets: boolean;

    @Column(DataType.BOOLEAN)
    smoking: boolean;

    @Column(DataType.ENUM('Introvert', 'Extrovert'))
    personality: 'Introvert' | 'Extrovert';

    @Column(DataType.INTEGER)
    age: number;

    @Column(DataType.TIME)
    wakeUpTime: string; // format 'HH:mm'

    @Column(DataType.TIME)
    bedTime: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    totalScore: number; // Total score calculated from above field

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    createdAt: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    updatedAt: Date;
}
