# Plan Master - Stabilization Checklist

> Статус документа: фінальний технічний checklist для комплексного stabilization/testing pass після завершення поточного циклу permission, sharing та audit foundation.

## Призначення

Цей документ не описує нову функціональність.

Його задача:

- зафіксувати, що саме треба перевірити наприкінці поточного циклу
- зібрати в одному місці auth/sync/runtime ризики, які свідомо не добивалися по одному під час основної реалізації
- дати порядок фінального прогону перед наступною великою фазою

## Коли запускати

Запускати після того, як:

- `Phase 1` по ролях і sharing доведений до потрібного рівня
- audit foundation уже пише події
- технічний cleanup permission/project-context/sync-status уже завершено

Не запускати посеред великого refactor, інакше частина findings швидко застаріє.

## Області перевірки

### 1. Auth і session lifecycle

Перевірити:

- реєстрацію нового користувача
- email confirmation flow
- вхід після підтвердження пошти
- відновлення сесії після reload
- logout
- коректне очищення локального auth/session state

Ризики:

- session є, але UI не відображає logged-in state
- підтверджений користувач виглядає як непідтверджений
- після logout залишаються чужі локальні дані або stale sync status

### 2. Local buffer і sync state

Перевірити:

- створення локального проєкту без логіну
- появу `_localVersion`, `_serverVersion`, `_localUpdatedAt`
- перехід статусів `offline -> warn -> syncing -> ok`
- sync після логіну
- sync після reload
- sync після перемикання між проєктами
- sync після повторного входу в already-confirmed акаунт

Ризики:

- локальні зміни є, але UI показує `ok`
- локальні зміни губляться після login/load
- один проєкт синкається у момент, коли користувач вже переключився на інший

### 3. Ролі та capability model

Окремо прогнати:

- `owner`
- `manager`
- `editor`
- `viewer`

Для кожної ролі перевірити:

- відкриття проєкту
- відкриття task modal
- task save/delete
- drag/resize
- dependency editing
- project settings
- share modal
- contractors mutations
- finance mutations

Ризики:

- readonly видно лише в UI, але mutating path все одно викликається
- `manager` і `editor` поводяться однаково там, де повинні відрізнятися
- old `_role: "admin"` snapshot некоректно проходить нормалізацію

### 4. Sharing flow

Перевірити:

- grant share
- change share role
- revoke share
- відкриття shared project з іншого акаунта
- project switching між own/shared snapshots

Ризики:

- share створено в БД, але локальний список/стан не оновився
- shared user бачить stale role до reload
- manager не може робити те, що дозволено policy

### 5. Audit foundation

Перевірити, що пишуться:

- `task.created`
- `task.updated`
- `task.deleted`
- `project.settings_updated`
- `project.baseline_saved`
- `project.baseline_cleared`
- `share.granted`
- `share.role_updated`
- `share.revoked`

Перевірити:

- правильний `project_id`
- правильний `actor_id`
- `entity_type` / `entity_id`
- payload shape без випадкового сміття з UI

Ризики:

- подія в UI відбулась, але в БД не записалась
- payload shape плаває між різними event families

### 6. Offline і reconnect

Перевірити:

- редагування без мережі
- накопичення локальних змін
- reconnect
- повторний sync після reconnect

Ризики:

- offline status не відображається
- reconnect не тригерить sync
- reconnect затирає локальні зміни серверним snapshot

### 7. Import/export і legacy snapshots

Перевірити:

- імпорт JSON-проєкту
- імпорт у logged-in режимі
- імпорт у guest режимі з подальшим login
- сумісність snapshot, де був старий `_role`

Ризики:

- імпортований проєкт не отримує коректний `_localUpdatedAt`
- imported snapshot ламає sync-status або role normalization

## Рекомендований порядок фінального прогону

1. Guest flow без логіну.
2. Login/register/confirmation flow.
3. Local-to-cloud sync flow.
4. Role matrix `owner/manager/editor/viewer`.
5. Sharing flow.
6. Audit DB verification.
7. Offline/reconnect.
8. Import/export і legacy snapshot compatibility.

## Що фіксувати під час прогону

Для кожного бага записувати:

- сценарій відтворення
- очікувану поведінку
- фактичну поведінку
- роль користувача
- чи був онлайн/офлайн
- чи це own project або shared project

Це потрібно, щоб не змішувати auth, sync і permission regressions в одну нечітку проблему.

## Exit criteria

Stabilization pass можна вважати завершеним, якщо:

- немає blocker-багів у login/sync flow
- capability model узгоджена між UI, local buffer і Supabase RLS
- shared project behavior стабільний для всіх ролей MVP
- audit log consistently пишеться для основних mutation flows
- offline/reconnect не втрачає дані

## Наступний крок після stabilization

Після цього етапу вже безпечніше:

- або переходити до наступної фази audit/read UI
- або починати окреме рішення щодо company/invite direction
- або планувати інкрементальну UI migration
