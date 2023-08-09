import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-settingsbar',
  templateUrl: './settingsbar.component.html',
  styleUrls: ['./settingsbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsbarComponent {}
