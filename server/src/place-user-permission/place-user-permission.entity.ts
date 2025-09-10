import { User } from 'src/auth/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from 'src/@common/transformers/numeric.transformer';

@Entity()
export class PlaceUserPermission extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  placeId: string;

  @Column({
    type: 'decimal',
    transformer: new ColumnNumericTransformer(),
  })
  userLatitude: number;

  @Column({
    type: 'decimal',
    transformer: new ColumnNumericTransformer(),
  })
  userLongitude: number;

  @Column({
    type: 'decimal',
    transformer: new ColumnNumericTransformer(),
  })
  placeLatitude: number;

  @Column({
    type: 'decimal',
    transformer: new ColumnNumericTransformer(),
  })
  placeLongitude: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({
    type: 'decimal',
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  distance: number; // 사용자와 장소 간의 거리 (미터)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
