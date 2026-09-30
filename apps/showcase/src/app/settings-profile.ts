import { Component } from '@angular/core';
import { AveAvatar } from '@avelune/ui/avatar';

/** The settings' profile section: who the person is in the organisation, which the personnel department keeps. */
@Component({
  selector: 'ave-showcase-settings-profile',
  imports: [AveAvatar],
  template: `
    <section class="section" aria-labelledby="profile-title" lang="ru">
      <h2 class="title" id="profile-title">Профиль</h2>
      <div class="person">
        <ave-avatar size="lg" name="Азиза Каримова" decorative />
        <div>
          <p class="name">Азиза Каримова</p>
          <p class="muted">Директор юридического департамента</p>
        </div>
      </div>
      <dl class="facts">
        <div>
          <dt>Почта</dt>
          <dd>a.karimova&#64;example.uz</dd>
        </div>
        <div>
          <dt>Телефон</dt>
          <dd class="phone">+998 71 200 10 20</dd>
        </div>
        <div>
          <dt>Подразделение</dt>
          <dd>Юридический департамент</dd>
        </div>
      </dl>
      <p class="muted">Данные профиля ведёт отдел кадров: если в них ошибка, напишите им.</p>
    </section>
  `,
  styleUrl: './settings-profile.css',
})
export class ProfileSection {}
