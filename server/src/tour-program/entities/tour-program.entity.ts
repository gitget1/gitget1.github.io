import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/auth/user.entity';
import { TourProgramSchedule } from './tour-program-schedule.entity';

@Entity()
export class TourProgram extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  guidePrice: number;

  @Column()
  region: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column('text', { array: true, default: '{}' })
  hashtags: string[];

  @Column({ default: false })
  unlocked: boolean;

  @Column({ nullable: true })
  unlockMethod: string;

  @Column({ nullable: true })
  unlockCost: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => User, (user) => user.tourPrograms, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => TourProgramSchedule, (schedule) => schedule.tourProgram, {
    cascade: true,
  })
  schedules: TourProgramSchedule[];
}
