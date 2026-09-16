*This project has been created as part of the 42 curriculum by [alejanr2], [fcasaubo], [xortega], [andefern].*

# Social Network 42

## Description

Social Network 42 is a web social network for the 42 community. It allows users to create a local account or log in with the 42 intra, complete a profile, publish content, connect with other users, and hold private conversations.

The project was built as a full-stack application: the client offers a responsive and internationalized interface, while the API manages authentication, business logic, and persistence in PostgreSQL. The application is distributed in Docker containers and published behind Nginx using HTTPS.

## Instructions

### Step-by-Step Execution

Getting started.

1. Clone the repository and navigate into the root directory:

    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2. Create an application in the API section of the 42 intra. Configure the callback as (in Redirect URI):

    `https://<SERVER_IP>:8443/api/auth/42/callback`

3. Build and start all containers and follow the terminal instructions:

    ```bash
    make docker-up
    ```

After startup, the application is available at `https://<SERVER_IP>:8443`. PostgreSQL and Adminer are only exposed on `127.0.0.1`: Adminer opens at `http://localhost:8080` with server `postgres`, username `postgres`, and the password configured in the generated environment file.

### Available Commands

| Command | Description |
| :--- | :--- |
| `make setup` | Generates `backend/.env` with local secrets and tokens. |
| `make docker-up` | Builds and starts Nginx, frontend, backend, PostgreSQL, and Adminer containers. |
| `make docker-build` | Forces a complete rebuild of Docker images without cache. |
| `make docker-down` | Stops services defined in the primary compose file. |
| `make docker-down-all` | Stops all application and persistent database containers. |
| `make docker-restart` | Restarts frontend and backend container services. |
| `make populate` | Populates the database with mocked-up users. |
| `make tester-build` | Installs dependencies to execute the tests. |
| `make tester-launch` | Launches the tester with all scenarios and shows failed or passed results. |
| `make tester-remove` | Removes the dependencies used to execute the tests. |

*Note:* If an existing PostgreSQL volume is mounted and tables are missing, `make docker-up` automatically re-runs `backend/init.sql`. Alternatively, run `make docker-clean` to purge volumes and recreate the database.

## Team Information

| Member | Assigned Role(s) | Primary Responsibilities |
| :--- | :--- | :--- |
| **alejanr2** | Tech Lead, Architect & Developer | Frontend architecture design, responsive layout integration, state management, UI component library, and team technical guidance. |
| **fcasaubo** | Tech Lead, Architect & Developer | Backend API architecture, relational database modeling, OAuth integration, input validation, and API security. |
| **xortega** | Project Manager, Scrum Master & Developer | Task estimation and sprint planning, progress tracking, and backend feature development (friendships, chat, status). |
| **andefern** | Product Owner & Developer | Defining product vision and value, accessibility/legal compliance, functional quality assurance, and user acceptance testing. |

## Project Management

- **Task Distribution & Sprints:** Work kicked off with bi-weekly in-person sprint meetings at 42 Urduliz to define the project scope, choose technical tooling, assign roles, and estimate workload. As development progressed, the team held monthly milestone checkpoints aligned with member availability.
- **Workflow & Version Control:** Tasks were planned in sprint backlogs and implemented on a shared GitHub repository. Feature-branch workflows were enforced with pull requests and code reviews prior to merging into `main`.
- **Project Tracking Tools:** Jira was utilized for backlog refinement, task estimation, and issue tracking.
- **Communication Channels:** Slack and WhatsApp served as daily asynchronous communication, technical discussions, and blockers coordination channels.

## Technical Stack

| Area | Technologies | Technical Rationale & Justification |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, React Router, Redux Toolkit, SCSS, PrimeReact | **React 19 & TypeScript** ensure component modularity, type safety, and fast rendering. **Vite** accelerates development and production builds. **Redux Toolkit** provides predictable state management, while **SCSS** supports the custom visual system. |
| **Backend** | Node.js, Express, JavaScript, Passport, passport-42 | **Express** delivers a lightweight, unopinionated REST API. **Passport.js** enables seamless OAuth 2.0 integration with the 42 intra. |
| **Database** | PostgreSQL 16, pg | **PostgreSQL** was chosen for its strict relational integrity, ACID compliance, and robust indexing for relational social graph queries (users, friendships, posts, and messages). |
| **Infrastructure** | Docker Compose, Nginx, Adminer | **Docker Compose** ensures a deterministic multi-container execution environment. **Nginx** acts as a reverse proxy managing SSL termination and routing between services. |
| **Security & Quality** | ESLint, scrypt, HTTP-Only Cookies, Input Validation | Strict payload validation, cryptographically strong **scrypt** password hashing, XSS/CSRF mitigation via HTTP-only session cookies, and server-side validation protect the application and its users. |

## Database Schema

PostgreSQL stores four core entities. Referential integrity is strictly enforced with foreign keys cascading from users. Indexes are applied on primary keys, relational lookups, and chronological queries (created_at, sent_at).

```text
    +--------------------+       1:N        +--------------------+
    |       users        | <------------->  |       posts        |
    +--------------------+                  +--------------------+
    | id (PK)            |                  | id (PK)            |
    | intra_id (UNIQUE)  |                  | author_id (FK)     |
    | username (UNIQUE)  |                  | content (TEXT)     |
    | email              |                  | media (TEXT)       |
    | password_hash      |                  | parent (FK)        |
    | profile_data       |                  | created_at         |
    | created_at         |                  +--------------------+
    +--------------------+
           |         |
       1:N |         | 1:N
           v         v
    +--------------------+                  +--------------------+
    |  friend_requests   |                  |   chat_messages    |
    +--------------------+                  +--------------------+
    | id (PK)            |                  | id (PK)            |
    | sender_id (FK)     |                  | sender_id (FK)     |
    | receiver_id (FK)   |                  | receiver_id (FK)   |
    | status (ENUM)      |                  | content (TEXT)     |
    | created_at         |                  | sent_at            |
    +--------------------+                  +--------------------+
```

| Table | Key Fields & Types | Relationships & Purpose |
| :--- | :--- | :--- |
| users | id (SERIAL PK), intra_id (VARCHAR), username (VARCHAR), email (VARCHAR), password_hash (VARCHAR), created_at (TIMESTAMP) | Stores user credentials, profile settings, and OAuth identifiers. |
| posts | id (SERIAL PK), author_id (INT FK), content (TEXT), likes (INT), media (TEXT), parent (INT FK), created_at (TIMESTAMP) | Stores user posts and image references. Images are associated with posts and are deleted when their post is deleted. |
| friend_requests | id (SERIAL PK), sender_id (INT FK), receiver_id (INT FK), status (VARCHAR), created_at (TIMESTAMP) | Models friendship states (pending, accepted, rejected). Enforces unique pairs between users. |
| chat_messages | id (SERIAL PK), sender_id (INT FK), receiver_id (INT FK), content (TEXT), sent_at (TIMESTAMP) | Persists direct messages between users and automatically cascades deletions upon user removal. |

*The full schema definition, constraints, and index configurations are available in `backend/init.sql`.*

## Features List

| Feature | Description | Primary Contributor(s) |
| :--- | :--- | :--- |
| **Registration & Login** | Local account registration, secure credential login, persistent sessions, and 42 OAuth authentication. | fcasaubo, alejanr2 |
| **User Profiles** | View and edit bio, display name, preset avatars, and browse other users' public profiles. | alejanr2, fcasaubo |
| **Post Feed & Threads** | Create posts, attach images, reply to existing threads, mention users, and react with likes. Images are removed when their associated posts are deleted. | alejanr2, xortega |
| **Friend Management** | Send, accept, or decline friend requests; remove friends; and view online status. | xortega, fcasaubo |
| **Direct Chat** | One-on-one direct messaging interface between connected users with chronological history and polling-based updates. | xortega, alejanr2 |
| **Notifications** | In-app notifications for pending friend requests and post mentions, with updates available while using the chat and social features. | xortega, alejanr2 |
| **i18n & Legal Pages** | Full interface localization in Spanish, Basque, and English; Privacy Policy and Terms of Service pages. | alejanr2, andefern |

## Modules

A balanced selection of 5 Major modules (2 points each) and 7 Minor modules (1 point each) was implemented to deliver an accessible, production-ready social network platform.

Total Points: 17 points

| Area | Module | Type | Points | Justification & Implementation | Main Contributors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Web | Frontend and backend frameworks | Major | 2 | React, TypeScript, and Vite structure the client; Node.js and Express expose server logic. This combination cleanly separates presentation, services, and persistence. | alejanr2, fcasaubo |
| Web | User interaction | Major | 2 | The UI allows editing profiles, posting, reacting, sending friend requests, accepting or rejecting them, removing friends, and chatting. React Router, Redux Toolkit, and reusable components ensure smooth interaction. | alejanr2, xortega |
| Web | Notification system | Minor | 1 | Pending friend requests and mentions in posts act as in-app notifications. Notifications are retrieved through request endpoints and updated through polling where necessary, including chat-related interactions. | xortega, alejanr2 |
| Web | Custom design system | Minor | 1 | A custom visual identity was created with SCSS, variables, responsive layouts, and reusable React components. Examples include the Header, Profile, Post, PostForm, Friends, FriendRequests, Chat, ChatMessage, NotificationBell, and LanguageSelector components. PrimeReact and PrimeFlex are used as support, not as a replacement for custom design. | alejanr2 |
| Web | File upload and management | Minor | 1 | Posts allow an image to be selected from the browser. The client validates the type and size, converts the image to a Data URL, and the API stores it linked to the post. Images are deleted together with the post; posts are the only place where uploaded images can be stored. | alejanr2, fcasaubo |
| Accessibility & i18n | WCAG 2.1 AA Compliance | Major | 2 | Accessibility was validated manually and with WAVE. The application includes aria-label attributes, alternative text, identifiable controls, semantic structure, responsive layouts, and visible error messages in interactive components. | alejanr2, andefern |
| Accessibility & i18n | Three languages | Minor | 1 | i18next and react-i18next manage translations in Spanish, Basque, and English. The application interface, including login, registration, messages, dates, labels, and legal pages, uses the translation system and adapts to the selected language. | alejanr2, andefern |
| Accessibility & i18n | Browser compatibility | Minor | 1 | The application is built with standard web technologies and responsive design for use across modern desktop and mobile browsers. | alejanr2 |
| User Management | Standard user management | Major | 2 | Implemented local registration, login, logout, persistent session, profile editing, friendships, and presence. Passwords are protected with scrypt hashing and user input is validated before processing. | fcasaubo, xortega |
| User Management | OAuth 2.0 Remote Authentication | Minor | 1 | Passport and passport-42 integrate the 42 intra. On first login, the user is created; subsequent logins update public data from the intra account. | fcasaubo, alejanr2 |
| Modules of Choice | Custom Module: Initial Social Network Seed | Minor | 1 | A mock SQL test script was prepared to provide a local account for testing the platform without relying exclusively on OAuth. This starting point makes it easy to verify linked data across profiles, posts, friends, and chat. | xortega, fcasaubo |
| Modules of Choice | Custom Module: Social API test | Major | 2 | A Behave tester executes 16 scenarios using natural-language steps to validate API calls and social features. The suite includes friend deletion and cleans up the relevant relationships, making it repeatable on a persistent database. | xortega, fcasaubo |

Calculation: 5 major modules × 2 points = 10 points; 7 minor modules × 1 point = 7 points. Total: 17 points.

## Individual Contributions

- alejanr2: Defined the frontend architecture and UI layout, worked on profiles, posts, chat, routing, styles, and internationalization. The main challenge was integrating a consistent UI across the application while maintaining responsive and accessible interactions.
- fcasaubo: Designed the database and backend layer, including relationships between users, posts, requests, and messages. Also contributed to authentication, validation, and API security. The main focus was ensuring reliable data handling and consistent backend behavior.
- xortega: Organized work estimates and tracking, and developed backend features related to friendships, presence, and messaging. Special care was taken with friend request consistency, message handling, notifications, and repeatable social API tests.
- andefern: Maintained product vision and functional validation, collaborated on testing and legal content, and helped detect integration issues. The main focus was ensuring primary flows were clear, accessible, and aligned with the project requirements.

## Resources

- Documentation for React, PrimeReact, Vite, Express, and PostgreSQL: API reference, configuration, and implementation practices.
- Passport and passport-42: OAuth authentication integration with 42 intra.
- Docker Compose and Nginx: Container definition, internal networking, and HTTPS reverse proxy.
- Redux Toolkit and i18next: Authentication state management and UI internationalization.

### AI Usage Description

AI was used as occasional support to clarify documentation, suggest implementation alternatives, proofread text, and assist with debugging errors. Architecture decisions, repository integration, testing, and final validation were performed and reviewed by the team.

