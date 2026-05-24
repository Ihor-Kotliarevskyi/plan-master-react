# Plan Master — Phase 1 implementation backlog

> Статус документа: `completed for current scope` станом на `2026-05-24`.
>
> `Phase 1` вже закритий для поточного migration scope. Цей документ
> залишається як зафіксований backlog і звіт по вже
> виконаних кроках.

## Поточний підсумок Phase 1

Впроваджено:

- project-level role model `owner / manager / editor / viewer`
- capability-based permission checks з єдиним permission layer
- Supabase schema, role migrations and RLS fixes під нову модель
- share management з role-aware UI and backend guards
- readonly and mutation gating для tasks, settings, contractors, finance, drag actions
- own/shared project presentation
- access banner and sync/status diagnostics
- audit log foundation and lightweight read UI

Залишок після Phase 1:

- загальна stabilization/testing wave наприкінці міграцій
- подальша UI/module migration, але вже поза межами `Phase 1`
## Призначення

Цей документ деталізує `Phase 1` з:

- `docs/ROLES_AND_SHARING_PLAN.md`
- `docs/TECH_MIGRATION_PLAN.md`

Його задача: перетворити roadmap на конкретну послідовність технічних задач для MVP ролей `owner/manager/editor/viewer`.

## Межі Phase 1

У цей етап входить:

- нова project-level role model
- capability-based permission checks
- оновлення share management
- оновлення UI-обмежень для mutating actions

У цей етап не входить:

- `companies`
- `company_members`
- tokenized invite links
- notifications
- повноцінний audit UI
- повний React rewrite

## Цільова рольова модель

### Ролі

- `owner`
- `manager`
- `editor`
- `viewer`

### Рекомендована матриця доступів для MVP

| Capability | owner | manager | editor | viewer |
|---|---|---|---|---|
| `canViewProject` | yes | yes | yes | yes |
| `canEditTasks` | yes | yes | yes | no |
| `canManageProject` | yes | yes | no | no |
| `canManageShares` | yes | yes | no | no |
| `canInviteUsers` | yes | yes | no | no |
| `canViewAuditLog` | yes | yes | yes | no |

## Що таке `manager` у першому MVP

Щоб роль не була "другою назвою admin", її треба зафіксувати так:

- `manager` може редагувати задачі
- `manager` може змінювати project settings
- `manager` може додавати/оновлювати/видаляти shares
- `manager` не може змінити owner
- `manager` не може видалити або архівувати проєкт, якщо ти додаси це пізніше окремою capability

Практичний сенс:

- `editor` працює із задачами
- `manager` керує проєктом та складом учасників
- `owner` лишається остаточним контролером проєкту

## Рекомендований технічний підхід

Не намагатися відразу переписати все. Для MVP достатньо:

1. Залишити існуючий UI
2. Винести permission functions в окремий модуль
3. Підмінити старі `canEdit()`-перевірки на granular checks
4. Доробити конкретні модалки та action buttons

## Порядок виконання

### Крок 1 — зафіксувати capability API

Потрібно ввести єдиний набір функцій:

- `getProjectRole()`
- `isOwner()`
- `canViewProject()`
- `canEditTasks()`
- `canManageProject()`
- `canManageShares()`
- `canInviteUsers()`
- `canViewAuditLog()`

Додатково:

- `getProjectPermissions()` як централізований computed object

Приклад форми:

```js
function getProjectPermissions(role) {
  return {
    canViewProject: true,
    canEditTasks: role === "owner" || role === "manager" || role === "editor",
    canManageProject: role === "owner" || role === "manager",
    canManageShares: role === "owner" || role === "manager",
    canInviteUsers: role === "owner" || role === "manager",
    canViewAuditLog: role === "owner" || role === "manager" || role === "editor",
  };
}
```

Рішення:

- старий `canEdit()` можна тимчасово лишити як alias до `canEditTasks()`
- але новий код вже не повинен спиратися на `canEdit()`

### Крок 2 — визначити точку істини для ролі

Зараз роль живе через `_projectRole` у backend adapter.

Для найближчого етапу треба:

- зберегти сумісність з `_projectRole`
- але зчитування capability робити через окремий permission module

Пізніше це дозволить прибрати role logic з `js/supabase-api.js`.

## Backlog по шарах

### 0. Supabase середовище для міграцій

Мета:

- не тестувати зміни ролей, constraints і RLS напряму на робочій базі

Рішення:

- для цього клону варто створити окремий Supabase project як staging/dev середовище
- production Supabase project залишити без змін до перевірки Phase 1
- URL і publishable key винести з `js/supabase-api.js` у конфігурацію на наступному технічному етапі

Чому це потрібно:

- перехід `admin -> manager` зачіпає існуючі записи `project_shares`
- RLS-помилки часто проявляються як "0 rows updated/selected", а не як явна помилка
- окремий project дозволить прогнати сценарії `owner/manager/editor/viewer` без ризику для реальних даних

Мінімальний порядок:

1. створити окремий Supabase project
2. перенести поточну схему
3. перенести мінімальні seed-дані або тестових користувачів
4. виконати role/RLS migration
5. перевірити сценарії доступів
6. лише після цього повторити міграцію на production

### 1. База даних і RLS

Мета:

- замінити роль `admin` на `manager`
- зафіксувати нову модель у БД

Задачі:

1. Оновити constraint або enum для `project_shares.role`
2. Промігрувати існуючі записи `admin -> manager`
3. Оновити RLS для `project_shares`
4. Оновити RLS для `projects`
5. Перевірити, що `owner` як і раніше визначається через `projects.owner_id`

Рішення для MVP:

- `owner` не записується в `project_shares.role`
- `manager` замінює `admin`

Open question:

- чи хочеш ти зберегти backward-compatible читання `admin` на короткий перехідний період

### 2. Permission module

Мета:

- перестати розмазувати role checks по всьому коду

Задачі:

1. Створити окремий модуль permission logic
2. Винести туди всю матрицю ролей
3. Дати сумісні глобальні функції для існуючого UI
4. Зробити так, щоб `_updateReadOnlyUI()` працював не лише від `viewer`

Definition of done:

- жодне нове місце не порівнює роль рядком напряму
- всі рішення йдуть через capability functions

### 3. Backend adapter

Поточні точки:

- `js/supabase-api.js:26`
- `js/supabase-api.js:27`
- `js/supabase-api.js:522`
- `js/supabase-api.js:539`
- `js/supabase-api.js:477`
- `js/supabase-api.js:510`

Задачі:

1. Замінити `isReadOnly()` і `canEdit()` на granular permission access
2. Оновити `apiShareProject()` під нові ролі
3. Оновити `apiUpdateShareRole()` під нові ролі
4. Оновити `openShareModal()` під новий список ролей
5. Заборонити share-операції, якщо немає `canManageShares()`
6. Заборонити invite-операції, якщо немає `canInviteUsers()`

Примітка:

- `openShareModal()` зараз напряму перевіряє `owner/admin`
- це треба замінити на capability check

### 4. UI gating для задач

Поточні точки:

- `js/modal.js:613`
- `js/render.js:173`
- `js/guard.js:4`
- `js/app.js:529`

Задачі:

1. Дозволити відкриття картки задачі для `viewer`, але без збереження
2. Заборонити `saveTask()` без `canEditTasks()`
3. Приховати або disable кнопки додавання/редагування задач для `viewer`
4. Перевірити drag-and-drop та resize для `viewer`
5. Перевірити dependency editing для `viewer`

MVP-рішення:

- `viewer` може дивитись
- `viewer` не може змінювати жодні task data

### 5. UI gating для налаштувань проєкту

Поточні точки:

- `js/modal.js:1142`
- `js/modal.js:1219`

Задачі:

1. `saveProjSettings()` має вимагати `canManageProject()`
2. `createProject()` лишається доступним logged-in користувачу як створення власного проєкту
3. Project settings UI має бути readonly для `editor/viewer`
4. `manager` має мати доступ до project settings

Примітка:

- створення нового власного проєкту не треба змішувати з правами всередині already-open project

### 6. UI gating для share management

Поточні точки:

- `js/supabase-api.js:539`
- `js/supabase-api.js:554`
- `js/supabase-api.js:590`

Задачі:

1. Показувати share button лише для `canManageShares()`
2. У модалці залишити ролі:
   - `viewer`
   - `editor`
   - `manager`
3. Заборонити самопризначення `owner`
4. Якщо потрібно, заборонити `manager` змінювати роль owner-related учасника в майбутньому

MVP-рішення:

- owner не редагується через share modal
- manager може керувати звичайними shares

### 7. UI gating для contractors і finance mutations

Поточні точки:

- `js/contractors.js:359`
- `js/contractors.js:1315`
- `js/contractors.js:1658`
- `js/contractors.js:1750`
- `js/contractors.js:2121`
- `js/finance.js:217`

Задачі:

1. Усі mutating actions тут перевести на `canEditTasks()`
2. Імпорт, ручне додавання, редагування, видалення мають бути заборонені для `viewer`
3. Перегляд таблиць лишити доступним для `viewer`

Причина:

- у поточній моделі contractor/finance дані фактично є частиною project/task domain

### 8. Сумісність і data migration

Мета:

- не зламати існуючих користувачів під час переходу

Задачі:

1. На час міграції трактувати `admin` як `manager`
2. Після міграції очистити всі UI labels і backend checks від `admin`
3. Перевірити імпортовані/старі локальні snapshots, якщо вони містять `_role`

Примітка:

- важливо перевірити локальні `allProjects[...]._role`

## Рекомендована технічна черга комітів

Найбезпечніше різати Phase 1 на такі шматки:

1. `docs`: матриця ролей + MVP-правила
2. `permissions core`: новий permission module + сумісні helper functions
3. `db/rls`: міграція ролей `admin -> manager`
4. `sharing ui/backend`: share modal + share API checks
5. `project settings gating`
6. `task gating`
7. `contractors/finance gating`
8. `cleanup`: прибрати старі прямі role checks

## Мінімальний MVP для релізу

Що має працювати обов'язково:

- `viewer` не може нічого змінювати
- `editor` може редагувати задачі, але не керує shares
- `manager` може редагувати задачі та керувати shares/project settings
- `owner` поводиться як головний адміністратор проєкту
- share modal показує нові ролі
- жодна mutating action не лишається лише на старому `canEdit()`

## Чекліст перевірки після реалізації

1. Увійти як `viewer` і перевірити:
   - відкриття проєкту
   - відкриття картки задачі
   - відсутність можливості зберегти задачу
   - відсутність mutating actions у contractors/finance
2. Увійти як `editor` і перевірити:
   - редагування задач
   - відсутність керування share
   - readonly або hidden project settings mutations
3. Увійти як `manager` і перевірити:
   - редагування задач
   - керування share
   - керування project settings
4. Увійти як `owner` і перевірити:
   - повний доступ
5. Перевірити локальний буфер і sync:
   - `_localVersion`
   - `_serverVersion`
   - `_role`
6. Перевірити project switching між own/shared проєктами

## Що робити відразу після Phase 1

Після успішного завершення цього backlog:

1. Додати backend-first audit log
2. Описати події audit model
3. Лише після цього приймати рішення про company layer

## Короткий висновок

`Phase 1` треба робити не як "додати ще одну роль", а як refactor усієї permission model на рівні:

- БД
- backend adapter
- UI gating
- local role state

Саме це дасть фундамент для audit, invites і подальшої міграції інтерфейсу.

