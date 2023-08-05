import { Component, ChangeDetectionStrategy } from '@angular/core';

import { MenuItem } from '@ui/nav-menu/nav-menu.type';
import { ThemeState } from '@shared/states/theme-state/theme.state';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavMenuComponent {
  public menuItems: MenuItem[] = [
    {
      name: 'navMenu.knowledgeBase',
      path: '/knowledge-base/view',
      isEnabled: false,
      isVisible: true,
      icon: 'knowledge-3',
      sorting: 0,
      // type: MenuItemType.KnowledgeBase,
    },
    {
      name: 'navMenu.tasks',
      path: '/task/list',
      isEnabled: false,
      isVisible: true,
      icon: 'task',
      sorting: 1,
      // type: MenuItemType.Tasks
    },
    {
      name: 'navMenu.schedule',
      path: '/task/schedule',
      isEnabled: false,
      isVisible: true,
      icon: 'schedule-2',
      sorting: 1,
    },
    {
      name: 'navMenu.clients',
      path: '/clients',
      isEnabled: false,
      isVisible: true,
      icon: 'client-1',
      sorting: 2,
      // type: MenuItemType.Clients
    },
    {
      name: 'navMenu.employees',
      path: '/employees',
      isEnabled: false,
      isVisible: true,
      icon: 'employee-group-1',
      sorting: 3,
      // type: MenuItemType.Employees
    },
    {
      name: 'navMenu.analytics',
      path: '/reports',
      isEnabled: false,
      isVisible: true,
      icon: 'analytics-6',
      sorting: 4,
      // type: MenuItemType.Reports
    },
    {
      name: 'navMenu.settings',
      path: '/settings',
      isEnabled: false,
      isVisible: true,
      icon: 'settings-4',
      sorting: 5,
      // type: MenuItemType.Settings,
      // isLastItemsGroup: true,
      // isAlwaysLast: true
    },
  ];

  constructor(public themeState: ThemeState) {}
}
