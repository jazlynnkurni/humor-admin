# Columbia Laughs · Admin

The admin area for the Columbia Laughs app (humor project, week 6). Same Supabase database, separate Next.js app and Vercel project.

Every route is behind a Google login wall, and only profiles with `is_superadmin = true` get past `/denied`. The flag is set in the database by its owner, never from this app, which is also the answer to the lock-out question: the first superadmin is granted with the SQL in `../humor-hello-world/supabase/week6-admin.sql`, run with the database connection the Supabase dashboard gives the project owner.

- `/` statistics: members, AI punchlines, lols, generations and lols per day, most laughed at, who generates, which model answered
- `/users` read profiles
- `/media` create, read, update and delete AI generated media (generations and their punchlines), by hand or with the model
- `/votes` read every lol
