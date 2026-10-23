--
-- PostgreSQL database dump
--

\restrict 1BUyBz0S8woqHwZf7AZrIG3rUXvzq3VfmIulF9EmFZHnPh7HVg0kWZ98oplx68a

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: file_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_id uuid NOT NULL,
    version_number integer NOT NULL,
    label text,
    content text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT file_versions_label_check CHECK (((label IS NULL) OR (char_length(label) <= 100))),
    CONSTRAINT file_versions_version_number_check CHECK ((version_number >= 1))
);


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    language text DEFAULT 'javascript'::text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    yjs_state bytea,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT files_language_check CHECK ((language = ANY (ARRAY['javascript'::text, 'python'::text]))),
    CONSTRAINT files_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100)))
);


--
-- Name: project_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_members (
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    added_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT project_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'editor'::text, 'viewer'::text])))
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT projects_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100)))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_email_lowercase CHECK ((email = lower(email))),
    CONSTRAINT users_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 80)))
);


--
-- Data for Name: file_versions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.file_versions (id, file_id, version_number, label, content, created_by, created_at) FROM stdin;
0b712d93-c034-4ad0-af5c-e543ea8f0473	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	1	Initial version	console.log("Hello from the playground");\n	11111111-1111-1111-1111-111111111111	2026-10-20 13:46:00.346007+01
db841aa1-e3d6-43fb-a1a9-b0eb6b3e9b8e	90ec2e3c-5828-496b-a56d-df8deb196fd7	1	API live snapshot	print("versioned")\n	c7830c9a-48e5-432b-a20f-60b98ef99513	2026-10-22 18:02:18.604274+01
70acd001-b540-4833-9e7a-5604448927c9	e291ccd6-01a6-49e6-84e9-8032fc0d7b97	1	1	console.log("Hello world")	9115a6f1-8510-448a-94e3-001fe36af6c3	2026-10-22 18:08:52.975722+01
08794dd2-0ae9-4fc1-821c-79528ccde4da	e291ccd6-01a6-49e6-84e9-8032fc0d7b97	2	2	console.log("Hello woyyrld")	9115a6f1-8510-448a-94e3-001fe36af6c3	2026-10-22 18:09:27.075871+01
b9ea59dd-4b7f-4d68-adb6-776d700fab69	e291ccd6-01a6-49e6-84e9-8032fc0d7b97	3	1	console.log("Hello World")	9115a6f1-8510-448a-94e3-001fe36af6c3	2026-10-23 09:47:15.607737+01
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.files (id, project_id, name, language, content, yjs_state, created_at, updated_at) FROM stdin;
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	hello.js	javascript	console.log("Hello from the playground");\n	\N	2026-10-20 13:46:00.340656+01	2026-10-20 13:46:00.340656+01
cccccccc-cccc-cccc-cccc-cccccccccccc	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	hello.py	python	print("Hello from the playground")\n	\N	2026-10-20 13:46:00.340656+01	2026-10-20 13:46:00.340656+01
90ec2e3c-5828-496b-a56d-df8deb196fd7	b99d47a7-7b3f-4578-be47-7e8b79dfb9fb	index.py	python	print("hello from live API")\n# synchronized from live WebSocket\n	\\x0201bdf888f9d9f4f30e00040107636f6e74656e741d7072696e74282268656c6c6f2066726f6d206c6976652041504922290a01daf287b5e1a5b60d0084bdf888f9d9f4f30e1c23232073796e6368726f6e697a65642066726f6d206c69766520576562536f636b65740a00	2026-10-22 17:57:43.855125+01	2026-10-22 18:02:24.82008+01
e291ccd6-01a6-49e6-84e9-8032fc0d7b97	c17823a2-6745-4196-ad4f-af1e7c181f71	app.js	javascript		\N	2026-10-22 18:08:30.333719+01	2026-10-22 18:08:30.333719+01
62fea2a6-ee03-4e42-9223-c44e1e7a841e	c17823a2-6745-4196-ad4f-af1e7c181f71	python.py	python		\N	2026-10-23 09:46:41.434326+01	2026-10-23 09:46:41.434326+01
\.


--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_members (project_id, user_id, role, added_at) FROM stdin;
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111111111	owner	2026-10-20 13:46:00.332475+01
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	22222222-2222-2222-2222-222222222222	editor	2026-10-20 13:46:00.332475+01
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	33333333-3333-3333-3333-333333333333	viewer	2026-10-20 13:46:00.332475+01
b99d47a7-7b3f-4578-be47-7e8b79dfb9fb	c7830c9a-48e5-432b-a20f-60b98ef99513	owner	2026-10-22 17:57:41.334929+01
c17823a2-6745-4196-ad4f-af1e7c181f71	9115a6f1-8510-448a-94e3-001fe36af6c3	owner	2026-10-22 18:07:21.629043+01
298e9fb0-dda6-4284-b716-da1659bfa4a8	5e4089d4-f59a-4ed1-a67f-130bfaad7d2e	owner	2026-10-22 18:17:35.638975+01
c17823a2-6745-4196-ad4f-af1e7c181f71	5e4089d4-f59a-4ed1-a67f-130bfaad7d2e	editor	2026-10-23 09:43:20.478836+01
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, name, description, owner_id, created_at, updated_at) FROM stdin;
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Welcome Project	Sample project for the demo	11111111-1111-1111-1111-111111111111	2026-10-20 13:46:00.326013+01	2026-10-20 13:46:00.326013+01
b99d47a7-7b3f-4578-be47-7e8b79dfb9fb	Frontend API smoke c84477cafb	Frontend connection project; full live checks passed	c7830c9a-48e5-432b-a20f-60b98ef99513	2026-10-22 17:57:41.334929+01	2026-10-22 18:01:29.69937+01
c17823a2-6745-4196-ad4f-af1e7c181f71	test	\N	9115a6f1-8510-448a-94e3-001fe36af6c3	2026-10-22 18:07:21.629043+01	2026-10-22 18:07:21.629043+01
298e9fb0-dda6-4284-b716-da1659bfa4a8	Shared code playground	\N	5e4089d4-f59a-4ed1-a67f-130bfaad7d2e	2026-10-22 18:17:35.638975+01	2026-10-22 18:17:35.638975+01
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, created_at) FROM stdin;
11111111-1111-1111-1111-111111111111	Alice	alice@example.com	$2a$10$A/QelU3WMUZ7KBdpb4S3quQHPZ6GqxKX13QRU0fl0p1VZOiMvVFla	2026-10-20 13:45:59.935695+01
22222222-2222-2222-2222-222222222222	Bob	bob@example.com	$2a$10$T4teTZQkMFjC7ysJpZfX1OncYKf9G1ff/na8wMD1xA/D92K5bcHRe	2026-10-20 13:45:59.935695+01
33333333-3333-3333-3333-333333333333	Carol	carol@example.com	$2a$10$oRk0K8eJC/OdqTykhJ4hkuxTJSfBpbq2HUNrMAdxlpUgqOYaGIqkq	2026-10-20 13:45:59.935695+01
c7830c9a-48e5-432b-a20f-60b98ef99513	Frontend Test c84477cafb	frontend-smoke-c84477cafb@example.com	$2b$10$5xir8bNHA9ZVkT/q.ywgreEONXSfB7CK9PGYQYKbyS61YGTExGJ2m	2026-10-22 17:57:40.105244+01
9115a6f1-8510-448a-94e3-001fe36af6c3	Ani Anthony	anianthony200@gmail.com	$2b$10$CEYygyGtSvIEQGenE4OqPuGJ3yH94AtkOTfowlYd0HoRjL4LZ7fV.	2026-10-22 18:07:07.172861+01
5e4089d4-f59a-4ed1-a67f-130bfaad7d2e	David	bluecharlie42@gmail.com	$2b$10$NZEcdDQtip4KAsy6lF5ydumTDJLFTzm0ykzDa4.azHay.bilsDJdu	2026-10-22 18:16:50.050246+01
\.


--
-- Name: file_versions file_versions_file_id_version_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT file_versions_file_id_version_number_key UNIQUE (file_id, version_number);


--
-- Name: file_versions file_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT file_versions_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: files files_project_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_project_id_name_key UNIQUE (project_id, name);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (project_id, user_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: file_versions_file_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_versions_file_idx ON public.file_versions USING btree (file_id, version_number DESC);


--
-- Name: project_members_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_members_user_idx ON public.project_members USING btree (user_id);


--
-- Name: project_one_owner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX project_one_owner_idx ON public.project_members USING btree (project_id) WHERE (role = 'owner'::text);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: files files_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER files_set_updated_at BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: projects projects_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: file_versions file_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT file_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: file_versions file_versions_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT file_versions_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: files files_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_members project_members_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_members project_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 1BUyBz0S8woqHwZf7AZrIG3rUXvzq3VfmIulF9EmFZHnPh7HVg0kWZ98oplx68a

