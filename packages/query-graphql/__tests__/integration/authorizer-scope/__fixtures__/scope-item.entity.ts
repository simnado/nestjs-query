// eslint-disable-next-line import/no-extraneous-dependencies
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { ScopeList } from './scope-list.entity'
import { ScopeSubTask } from './scope-sub-task.entity'

@Entity('scope_item')
export class ScopeItem {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @Column()
  owner: string

  @Column()
  listId: number

  @ManyToOne(() => ScopeList, (list) => list.items)
  list: ScopeList

  @OneToMany(() => ScopeSubTask, (subTask) => subTask.item)
  subTasks: ScopeSubTask[]
}
