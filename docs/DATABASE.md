# База даних — Supabase

## Огляд

Поточний застосунок використовує Supabase як основний бекенд. На рівні клієнта активно використовується `js/supabase-api.js`.

Основні сутності:

- `profiles`
- `projects`
- `tasks`
- `project_shares`
- `activity_log`

Основний RPC:

- `upsert_tasks(p_project_id uuid, p_tasks jsonb)`

## `profiles`

Профілі користувачів синхронізуються з `auth.users`.

Колонки, які реально використовує клієнт:

- `id uuid`
- `name text`
- `email text`
- `avatar text`
- `theme text`
- `default_sm int2`
- `default_sy int4`
- `default_nm int2`

Клієнт читає профіль у `_loadProfile()` і оновлює через `apiUpdateProfile()`.

## `projects`

### Колонки

- `id uuid`
- `owner_id uuid`
- `name text`
- `sm int2`
- `sy int4`
- `nm int2`
- `cats jsonb`
- `next_n int4`
- `baseline jsonb`
- `baseline_date text`
- `is_archived bool`
- `updated_at timestamptz`

### Що реально синхронізується

`apiSyncProject()` зараз оновлює:

- `name`
- `sm`
- `sy`
- `nm`
- `cats`
- `next_n`
- `baseline`
- `baseline_date`
- `updated_at`

### Що не є частиною поточного серверного контракту

`proj.paymentRegisters` активно використовується в UI, але наразі не синхронізується в `projects` через `supabase-api.js`. Це локальний snapshot-стан, а не гарантована серверна колонка поточної реалізації.

## `tasks`

### Колонки

- `id uuid`
- `project_id uuid`
- `n int4`
- `"order" int4`
- `name text`
- `cat int4`
- `ms int2`
- `ws int2`
- `me int2`
- `we int2`
- `prog int2`
- `budget numeric`
- `spent numeric`
- `deps jsonb`
- `phases jsonb`
- `cost_items jsonb`
- `notes jsonb`

### Важливе уточнення

У поточному клієнтському коді `cat` обробляється як числовий індекс категорії, а не як текстовий id. Тому документація має вважати `cat` числовим значенням, узгодженим з індексом елемента в `projects.cats`.

## Формат `deps`

Поточний формат залежностей:

```json
[
  { "id": "task-uuid", "type": "FS", "threshold": 0 }
]
```

Підтримувані типи:

- `FS`
- `SS`
- `FF`

Зауваження:

- старі залежності, що посилались на `n`, мігруються на клієнті в `storage.js`
- CPM у `critical.js` зараз ігнорує `FF` у розрахунку графа критичного шляху

## Формат `phases`

Поточний клієнт очікує масив на кшталт:

```json
[
  { "ms": 0, "ws": 0, "me": 0, "we": 3, "prog": 100 }
]
```

Поле `name` для фаз не є обов’язковою частиною поточного UI-контракту.

## Формат `cost_items`

Поточний клієнтський формат:

```json
[
  {
    "id": 123,
    "type": "work",
    "name": "Монтажні роботи",
    "supplier": "ТОВ Підрядник",
    "unit": "договір",
    "qty": 1,
    "unitPrice": 250000,
    "contractNo": "15/05-26",
    "contractDate": "2026-05-15",
    "acts": [
      {
        "id": 1,
        "name": "Акт №1",
        "date": "2026-05-30",
        "amount": 120000,
        "note": "Перший етап"
      }
    ],
    "payments": [
      {
        "id": 2,
        "date": "2026-05-20",
        "type": "act",
        "amount": 100000,
        "contractId": 123,
        "actNo": "Акт №1",
        "note": "Оплата згідно акту"
      }
    ]
  }
]
```

### Типи `cost_items[].type`

- `material`
- `work`
- `equipment`
- `other`

### Типи `payments[].type`

- `advance`
- `act`
- `invoice`
- `other`

### Важливі бізнес-правила

- `supplier` є джерелом для вкладки `Контрагенти`
- `contractId` у платежі посилається на `cost_items[].id`
- сума `cost_items` не зобов’язана дорівнювати `tasks.budget`
- різниця між `tasks.budget` і сумою позицій використовується для UI-поняття `Нерозподілений кошторис`
- позиції без `supplier` агрегуються як `Без контрагента`

## Формат `notes`

Поточний UI працює з об’єктами нотаток, що можуть містити:

```json
[
  {
    "id": 1,
    "text": "Коментар",
    "author": "Користувач",
    "date": "16.05.2026, 10:20",
    "deleted": false,
    "history": [
      {
        "action": "edit",
        "text": "Старий текст",
        "author": "Користувач",
        "date": "16.05.2026, 09:10"
      }
    ]
  }
]
```

Тобто опис `[{text, createdAt}]` уже занадто спрощений для поточного застосунку.

## `project_shares`

Поточна реалізація шерінгу використовує:

- `id uuid`
- `project_id uuid`
- `user_id uuid`
- `role text`
- `invited_by uuid`
- `created_at timestamptz`

Поточні ролі:

- `viewer`
- `editor`
- `manager`

`owner` у поточному коді не зберігається як рядок у `project_shares`; власник визначається через `projects.owner_id`.

Примітка щодо сумісності:

- legacy-значення `admin` ще може траплятися в старих даних
- активний клієнт нормалізує `admin` до `manager`

## RLS — фактична модель доступу

### `projects`

- `SELECT`: власник або користувач, присутній у `project_shares`
- `INSERT`: автентифікований користувач з `owner_id = auth.uid()`
- `UPDATE`: власник або роль `editor/manager`
- `DELETE`: тільки власник

Технічне уточнення:

- у поточному клієнті `apiSyncProject()` оновлює і `projects`, і `tasks` в одному sync-flow
- тому `editor` тимчасово зберігає `UPDATE` для `projects`, навіть якщо бізнесово `project settings` уже обмежуються через capability layer

### `project_shares`

- `SELECT`: власник проєкту, `manager` або сам запрошений
- `INSERT`: власник або `manager`
- `UPDATE`: власник або `manager`
- `DELETE`: власник або `manager`

## `activity_log`

Backend-first audit foundation uses:

- `id uuid`
- `project_id uuid`
- `actor_id uuid`
- `actor_name text`
- `actor_email text`
- `event_type text`
- `entity_type text`
- `entity_id text`
- `payload jsonb`
- `created_at timestamptz`

Current intended event families:

- `task.created`
- `task.updated`
- `task.deleted`
- `project.settings_updated`
- `project.baseline_saved`
- `project.baseline_cleared`
- `share.granted`
- `share.role_updated`
- `share.revoked`

Payload contract:

- top-level `entity_type` and `entity_id` live in dedicated columns
- `payload` stores only event-specific details
- task events should prefer `taskN`, `taskName`, and compact flags such as `hasPhases`
- project mutation events may store `before` / `after`
- share events may store `email` and `role`

RLS model:

- `INSERT`: authenticated user with `actor_id = auth.uid()` and any project membership
- `SELECT`: `owner`, `manager`, `editor`
- `UPDATE` / `DELETE`: not granted to `authenticated`

Implementation note:

- foundation starts as backend-first logging
- current client contract can already read raw events through `apiGetActivityLog()`
- timeline/UI can be added later without changing the event storage contract

### `tasks`

Доступ до `tasks` наслідується від доступу до пов’язаного проєкту.

## RPC `upsert_tasks`

### Призначення

RPC робить повну атомарну заміну списку задач проєкту:

- видаляє задачі, яких немає в payload
- вставляє або оновлює ті, що є

### Мапінг полів

- `task->'costItems'` → `cost_items`
- `task->'phases'` → `phases`
- `task->'notes'` → `notes`
- `deps` передається як jsonb без додаткової серверної нормалізації

### Де викликається

- `apiSyncProject()`
- `apiCreateProject()`

## RPC `get_user_id_by_email`

Використовується в `apiShareProject()` для пошуку користувача за email перед додаванням запису в `project_shares`.

## Практичний висновок

На поточному етапі схема реально підтримує:

- auth/profile
- проєкти
- задачі з залежностями, фазами, кошторисом і нотатками
- спільний доступ на рівні проєкту

Але ще не є повністю узгодженою з усім локальним UI-станом, зокрема щодо `paymentRegisters`, які зараз залишаються локальною функцією інтерфейсу.
