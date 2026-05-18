# Plan Master — технічний план міграції та поетапної модернізації

> Статус документа: execution plan для поточного коду станом на `2026-05-16`.

## Призначення документа

Цей документ відповідає на інше питання, ніж `ROLES_AND_SHARING_PLAN.md`.

- `ROLES_AND_SHARING_PLAN.md` описує продуктову еволюцію доступів і collaborative-функцій
- `TECH_MIGRATION_PLAN.md` описує, як технічно підготувати кодову базу до цих змін без дорогого та ризикового rewrite

Рекомендація: не змішувати ці два документи в один. Product roadmap і технічний execution plan мають жити окремо, але з узгодженою чергою фаз.

## Вихідний стан

Поточний застосунок уже розбитий на JS-файли, але ще не має достатньо ізольованої архітектури для безпечного масштабування ролей, доступів, audit log та org-level моделі.

Ключові технічні обмеження поточного стану:

- runtime збирається через `<script>` у `index.html`
- UI активно спирається на inline `onclick`
- стан зберігається у глобальних змінних (`tasks`, `proj`, `cats`, `allProjects`, `_projectRole`)
- Supabase-адаптер містить не лише transport/data-access, а й частину permission logic
- readonly/access behavior розмазаний між `supabase-api.js`, `guard.js`, `render.js`, `finance.js`, `contractors.js`
- бізнес-логіка доступів поки що бінарна: `canEdit()` проти `viewer`

Через це головна проблема не в JavaScript як мові, а в слабкому розділенні:

- доменної логіки
- permission logic
- UI composition
- backend adapter layer

## Цільовий технічний напрямок

Рекомендований цільовий стек:

- `Vite`
- `TypeScript`
- `React`
- `Zustand`
- `Zod`
- `Supabase`

Але важливо: перехід має бути інкрементальним, а не через повний rewrite до початку бізнес-змін.

## Головний принцип послідовності

Правильна черга така:

1. Спершу стабілізувати доменну модель і permission model
2. Потім винести логіку зі "змішаних" файлів у окремі модулі
3. Потім додати типізацію
4. Потім реалізувати найближчу продуктову фазу з ролями
5. Лише після цього вирішувати, чи переносити весь UI на React, чи робити поступову міграцію

Іншими словами:

- не робити повний rewrite перед `Phase 1`
- не імплементувати великі нові ролі та org-level можливості поверх поточної неструктурованої permission logic

## Рекомендована послідовність робіт

### Етап 0 — заморозити цільову бізнес-модель

Статус: `перший обов'язковий крок`

Мета:

- формалізувати capability-based model поверх ролей
- відв'язати код від бінарної моделі `viewer` / `not viewer`

Що зафіксувати:

- ролі `owner`, `manager`, `editor`, `viewer`
- явні capability-функції:
  - `canViewProject`
  - `canEditTasks`
  - `canManageProject`
  - `canManageShares`
  - `canInviteUsers`
  - `canViewAuditLog`

Результат етапу:

- оновлена матриця доступів
- узгоджені правила для UI, RLS, sync-операцій і модалок

Чому це перше:

- без цього будь-яка міграція стеку лише переноситиме стару нечітку permission model у новий код

### Етап 1 — модульна декомпозиція без зміни UI-стеку

Статус: `виконати до великого функціонального розширення`

Мета:

- підготувати код до складніших змін, не ламаючи застосунок повним rewrite

Що зробити:

- виділити окремий шар для permission logic
- виділити окремий шар для project/domain operations
- відокремити Supabase transport від permission checks
- звузити відповідальність `js/supabase-api.js`

Мінімальна цільова структура:

```text
src/
  domain/
    permissions/
    projects/
    sharing/
    audit/
  services/
    supabase/
  ui/
    legacy/
```

Примітка:

- не обов'язково одразу переносити весь runtime у `src/`
- достатньо почати з нових модулів і підключати їх до існуючого UI

Результат етапу:

- менше умов типу `if (typeof canEdit === "function" && !canEdit())`
- один центр істини для permission logic

### Етап 2 — перехід на TypeScript без повного переписування

Статус: `робити одразу після декомпозиції`

Мета:

- знизити ризик регресій перед зміною ролей, invite flow та audit model

Що типізувати в першу чергу:

- `Project`
- `Task`
- `ProjectShare`
- `ProjectRole`
- `PermissionSet`
- `AuditEvent`
- `Profile`

Що дати через runtime validation:

- payload задач
- shares
- profile/project snapshots
- дані з Supabase RPC

Чому не відкладати:

- майбутні зміни торкаються доступів, sync, БД і UI одночасно
- типи тут окупаються швидко

### Етап 3 — реалізація `Phase 1` з `ROLES_AND_SHARING_PLAN`

Статус: `перший великий функціональний етап`

Мета:

- перейти з `viewer/editor/admin` до `owner/manager/editor/viewer`
- замінити бінарні access checks на capability-based checks

Що включає:

- DB constraint / enum / check update для ролей
- оновлення permission matrix
- оновлення RLS та mutation rules
- refactor `canEdit()` у набір granular checks
- точкове оновлення UI-контролів:
  - task editing
  - project settings
  - share modal
  - contractors/finance mutating actions

Definition of done:

- кожна mutating action перевіряє конкретну capability
- `viewer` більше не є єдиним special-case
- `manager` реально відрізняється від `editor`

### Етап 4 — audit log

Статус: `робити відразу після стабілізації ролей`

Мета:

- отримати трасованість змін до ускладнення org-level моделі

Рекомендована черга:

1. write-only backend logging
2. читання audit events
3. timeline/UI

Події мінімального набору:

- create/update/delete task
- share granted/updated/revoked
- project settings changed
- baseline changed

Чому саме тут:

- після розширення ролей з'являється більше критичних змін, які вже треба відслідковувати

### Етап 5 — рішення щодо company/org layer

Статус: `architectural checkpoint`

На цьому етапі треба не кодувати одразу `companies`, а прийняти рішення:

- чи це справді потрібна бізнес-модель
- чи достатньо project-level invites + stronger sharing + audit log

Критерії "так, потрібен org layer":

- один користувач має системно працювати в межах кількох проєктів однієї компанії
- потрібні спільні каталоги людей/доступів
- потрібна company visibility model
- потрібен company onboarding/admin flow

Якщо відповідь "ні" або "ще рано":

- робити lightweight project invite links
- не тягнути весь `companies` layer завчасно

### Етап 6 — invite system

Статус: `залежить від рішення на попередньому етапі`

Варіант A — без company layer:

- tokenized invite links для проєкту
- pending invite acceptance
- простий accept flow

Варіант B — з company layer:

- `company_invites`
- onboarding into company + project scope

### Етап 7 — company/org model

Статус: `робити лише якщо це підтверджена потреба`

Мета:

- ввести окремий системний шар організації

Що входить:

- `companies`
- `company_members`
- `company_invites`
- `profiles.company_id` або окрема membership model
- org-level roles
- visibility rules між company та project scope

Це вже не "наступний маленький крок", а окремий великий етап.

### Етап 8 — поступова UI-міграція на React

Статус: `після стабілізації домену`

Мета:

- прибрати залежність від inline handlers, глобального DOM orchestration і ручних rerender flows

Рекомендована стратегія:

1. Спершу перенести isolated areas:
   - user cabinet
   - share modal
   - project settings
2. Потім перенести panes з меншою зв'язаністю:
   - charts
   - finance subviews
3. Потім братися за найризиковіші частини:
   - gantt grid
   - drag/resize
   - print pipeline

Чому не навпаки:

- gantt і print найбільш чутливі до regressions
- вони мають іти вже після стабілізації permission model та data contracts

## Що робити першим на практиці

Найкраща послідовність для цього репозиторію:

1. Оновити матрицю ролей і capability model в документації
2. Винести permission logic в окремий модуль
3. Винести project/sharing operations з `js/supabase-api.js`
4. Підключити TypeScript для нових модулів
5. Реалізувати `owner/manager/editor/viewer`
6. Додати audit log
7. Прийняти рішення по company layer
8. Лише потім починати React-міграцію

## Що не варто робити

- не переписувати весь застосунок на React до стабілізації permission model
- не додавати `companies` до завершення granular project roles
- не переносити в новий стек стару бінарну модель `canEdit()`
- не змішувати audit log і notifications в один етап
- не починати UI rewrite з gantt та print subsystem

## Документи та залежності між ними

Рекомендований спосіб читання:

1. `docs/ROLES_AND_SHARING_PLAN.md`
2. `docs/TECH_MIGRATION_PLAN.md`
3. `docs/PHASE1_IMPLEMENTATION_BACKLOG.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DATABASE.md`

Ролі документів:

- `ROLES_AND_SHARING_PLAN.md` відповідає за `що будуємо`
- `TECH_MIGRATION_PLAN.md` відповідає за `в якій технічній черзі будуємо`
- `PHASE1_IMPLEMENTATION_BACKLOG.md` відповідає за `що саме робимо в найближчому етапі`
- `ARCHITECTURE.md` фіксує поточний стан системи
- `DATABASE.md` фіксує поточний серверний контракт

## Короткий висновок

Для поточного застосунку правильний порядок такий:

1. не повний rewrite
2. не одразу company layer
3. спершу permission/domain refactor
4. потім granular roles
5. потім audit log
6. потім рішення про org model
7. і лише після цього поступова UI-міграція
