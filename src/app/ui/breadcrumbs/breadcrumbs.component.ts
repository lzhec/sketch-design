import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  ActivationEnd,
  NavigationEnd,
  NavigationStart,
  Router,
  UrlSegment,
} from '@angular/router';

import { Breadcrumb } from './breadcrumb';
// import { globals } from 'app/app.component';

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
})
export class BreadcrumbsComponent implements OnInit, OnDestroy {
  @Input() isSettings = false;
  @Input() mainColor = false;

  public breadcrumbs: Breadcrumb[] = [];
  public ownBreadcrumbs: Breadcrumb[] = [];

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
  ) {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this.breadcrumbs = [];
      }

      if (e instanceof ActivationEnd) {
        if (e.snapshot.data['breadcrumb']) {
          const breadcrumb = e.snapshot.data['breadcrumb'] as Breadcrumb;
          if (!breadcrumb.href) {
            const urls = this.getUrlPaths(e.snapshot);
            const href = '/' + urls.join('/');

            breadcrumb.href = href;
          }
          breadcrumb.href = this.getHrefSettingsAccessDenied(breadcrumb.href);
          this.breadcrumbs.unshift(breadcrumb);
        }
      }
      if (e instanceof NavigationEnd) {
        this.ownBreadcrumbs = JSON.parse(JSON.stringify(this.breadcrumbs));
      }
    });
  }

  ngOnInit(): void {}

  private getHrefSettingsAccessDenied(href: string) {
    // if (href === '/settings') {
    //   const user = this.authService.userProfile$.value;
    //   if (user) {
    //     const permissions = user.permissions;
    //     if (permissions.length > 0 && permissions.indexOf(permissionMap.Settings_AccessDenied) > -1) {
    //       return '/settingsemployee/gridstatessetting';
    //     }
    //   }
    // }
    return href;
  }

  private getUrlPaths(snapshot: ActivatedRouteSnapshot): string[] {
    let result: string[] = [];
    let segments = this.agregateUrlSegments(snapshot, []);

    for (var i = 0; i < segments.length; i++) {
      result.push(segments[i].path);
    }

    return result;
  }

  private agregateUrlSegments(
    snapshot: ActivatedRouteSnapshot,
    array: UrlSegment[],
  ): UrlSegment[] {
    if (snapshot.url) {
      array = snapshot.url.concat(array);
    }

    if (snapshot.parent) {
      array = this.agregateUrlSegments(snapshot.parent, array);
    }

    return array;
  }

  // getUserInitials(name: string) {
  //   return globals.getUserInitials(name);
  // }

  ngOnDestroy() {}
}
