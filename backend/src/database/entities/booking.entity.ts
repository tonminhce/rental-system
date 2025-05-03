import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.entity';
import { RentalPost } from './rental-post.entity';

// Booking status
export enum BookingRequestStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    CANCELED = 'canceled',
    COMPLETED = 'completed',
}

@Table({
    tableName: 'bookings',
    underscored: true,
})
export class Booking extends Model<Booking> {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    id: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'user_id',
        onDelete: 'CASCADE',
    })
    userId: number;

    @ForeignKey(() => RentalPost)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'post_id',
        onDelete: 'CASCADE',
    })
    postId: number;

    @Column({
        type: DataType.ENUM(...Object.values(BookingRequestStatus)),
        defaultValue: BookingRequestStatus.PENDING,  // Default status: 'pending'
        allowNull: false,
    })
    status: BookingRequestStatus;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false,
        field: 'start_date',
    })
    startDate: Date;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false,
        field: 'end_date',
    })
    endDate: Date;

    @BelongsTo(() => User)
    user: User;

    @BelongsTo(() => RentalPost)
    rentalPost: RentalPost;
}
