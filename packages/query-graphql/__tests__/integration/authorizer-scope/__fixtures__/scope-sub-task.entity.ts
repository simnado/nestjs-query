// eslint-disable-next-line import/no-extraneous-dependencies
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { ScopeItem } from './scope-item.entity'

@Entity('scope_sub_task')
export class ScopeSubTask {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @Column()
  owner: string

  @Column()
  done: boolean

  @Column()
  itemId: number

  @ManyToOne(() => ScopeItem, (item) => item.subTasks)
  item: ScopeItem
}
