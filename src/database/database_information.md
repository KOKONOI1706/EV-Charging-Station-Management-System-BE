-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audit_logs (
  audit_id bigint NOT NULL,
  actor_user_id integer,
  action_type character varying,
  target_table character varying,
  target_id bigint,
  payload jsonb,
  created_at timestamp without time zone DEFAULT now(),
  ip_address character varying,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (audit_id),
  CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.bookings (
  booking_id integer NOT NULL DEFAULT nextval('bookings_booking_id_seq'::regclass),
  user_id integer,
  point_id integer,
  start_time timestamp without time zone NOT NULL,
  expire_time timestamp without time zone NOT NULL,
  status character varying DEFAULT 'Pending'::character varying,
  confirmed_at timestamp without time zone,
  canceled_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  promo_id integer,
  price_estimate numeric,
  station_id uuid,
  CONSTRAINT bookings_pkey PRIMARY KEY (booking_id),
  CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT bookings_point_id_fkey FOREIGN KEY (point_id) REFERENCES public.charging_points(point_id),
  CONSTRAINT bookings_promo_id_fkey FOREIGN KEY (promo_id) REFERENCES public.promotions(promotion_id),
  CONSTRAINT bookings_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.stations(id)
);
CREATE TABLE public.charging_points (
  point_id integer NOT NULL DEFAULT nextval('charging_points_point_id_seq'::regclass),
  connector_type_id integer,
  name character varying,
  status USER-DEFINED DEFAULT 'Available'::charging_status,
  power_kw numeric,
  price_rate numeric DEFAULT 0,
  idle_fee_per_min numeric DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  last_seen_at timestamp without time zone,
  station_id uuid,
  pos_x numeric,
  pos_y numeric,
  CONSTRAINT charging_points_pkey PRIMARY KEY (point_id),
  CONSTRAINT charging_points_connector_type_id_fkey FOREIGN KEY (connector_type_id) REFERENCES public.connector_types(connector_type_id),
  CONSTRAINT charging_points_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.stations(id)
);
CREATE TABLE public.charging_sessions (
  session_id integer NOT NULL DEFAULT nextval('charging_sessions_session_id_seq'::regclass),
  user_id integer,
  vehicle_id integer,
  point_id integer,
  booking_id integer,
  start_time timestamp without time zone NOT NULL,
  end_time timestamp without time zone,
  meter_start numeric,
  meter_end numeric,
  energy_consumed_kwh numeric DEFAULT 0,
  idle_minutes integer DEFAULT 0,
  idle_fee numeric DEFAULT 0,
  cost numeric DEFAULT 0,
  payment_id integer,
  status character varying DEFAULT 'Active'::character varying,
  created_at timestamp without time zone DEFAULT now(),
  initial_battery_percent numeric,
  target_battery_percent numeric DEFAULT 100.00,
  estimated_completion_time timestamp with time zone,
  battery_full_time timestamp with time zone,
  idle_start_time timestamp with time zone,
  auto_stopped boolean DEFAULT false,
  estimated_end_time timestamp with time zone,
  CONSTRAINT charging_sessions_pkey PRIMARY KEY (session_id),
  CONSTRAINT charging_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT charging_sessions_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(vehicle_id),
  CONSTRAINT charging_sessions_point_id_fkey FOREIGN KEY (point_id) REFERENCES public.charging_points(point_id),
  CONSTRAINT charging_sessions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id),
  CONSTRAINT charging_sessions_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(payment_id)
);
CREATE TABLE public.connector_types (
  connector_type_id integer NOT NULL DEFAULT nextval('connector_types_connector_type_id_seq'::regclass),
  code character varying UNIQUE,
  name character varying,
  max_power_kw numeric,
  CONSTRAINT connector_types_pkey PRIMARY KEY (connector_type_id)
);
CREATE TABLE public.feedbacks (
  feedback_id integer NOT NULL DEFAULT nextval('feedbacks_feedback_id_seq'::regclass),
  user_id integer,
  station_id integer,
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT feedbacks_pkey PRIMARY KEY (feedback_id),
  CONSTRAINT feedbacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.invoices (
  invoice_id integer NOT NULL DEFAULT nextval('invoices_invoice_id_seq'::regclass),
  user_id integer,
  session_id integer,
  payment_id integer,
  total_amount numeric,
  issued_at timestamp without time zone DEFAULT now(),
  status character varying DEFAULT 'Issued'::character varying,
  CONSTRAINT invoices_pkey PRIMARY KEY (invoice_id),
  CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT invoices_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.charging_sessions(session_id),
  CONSTRAINT invoices_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(payment_id)
);
CREATE TABLE public.maintenances (
  maintenance_id integer NOT NULL DEFAULT nextval('maintenances_maintenance_id_seq'::regclass),
  station_id integer,
  point_id integer,
  reported_by integer,
  assigned_to integer,
  description text,
  status character varying DEFAULT 'Open'::character varying,
  reported_at timestamp without time zone DEFAULT now(),
  resolved_at timestamp without time zone,
  CONSTRAINT maintenances_pkey PRIMARY KEY (maintenance_id),
  CONSTRAINT maintenances_point_id_fkey FOREIGN KEY (point_id) REFERENCES public.charging_points(point_id),
  CONSTRAINT maintenances_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(user_id),
  CONSTRAINT maintenances_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(user_id)
);
CREATE TABLE public.notifications (
  notification_id integer NOT NULL DEFAULT nextval('notifications_notification_id_seq'::regclass),
  user_id integer,
  message text,
  type character varying,
  sent_time timestamp without time zone DEFAULT now(),
  status character varying DEFAULT 'Sent'::character varying,
  CONSTRAINT notifications_pkey PRIMARY KEY (notification_id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.payment_methods (
  method_id integer NOT NULL DEFAULT nextval('payment_methods_method_id_seq'::regclass),
  code character varying UNIQUE,
  name character varying,
  CONSTRAINT payment_methods_pkey PRIMARY KEY (method_id)
);
CREATE TABLE public.payments (
  payment_id integer NOT NULL DEFAULT nextval('payments_payment_id_seq'::regclass),
  user_id integer,
  method_id integer,
  amount numeric NOT NULL,
  currency character varying DEFAULT 'VND'::character varying,
  date timestamp without time zone DEFAULT now(),
  status character varying DEFAULT 'Pending'::character varying,
  external_reference character varying,
  created_at timestamp without time zone DEFAULT now(),
  session_id integer,
  order_id character varying UNIQUE,
  payment_url text,
  qr_code_url text,
  momo_request_id character varying,
  momo_signature character varying,
  momo_response jsonb,
  payment_method character varying DEFAULT 'momo'::character varying,
  transaction_id character varying,
  paid_at timestamp without time zone,
  package_id integer,
  CONSTRAINT payments_pkey PRIMARY KEY (payment_id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT payments_method_id_fkey FOREIGN KEY (method_id) REFERENCES public.payment_methods(method_id),
  CONSTRAINT payments_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.charging_sessions(session_id)
);
CREATE TABLE public.promotions (
  promotion_id integer NOT NULL DEFAULT nextval('promotions_promotion_id_seq'::regclass),
  code character varying UNIQUE,
  description text,
  discount_type character varying,
  discount_pct numeric,
  discount_amount numeric,
  valid_from timestamp without time zone,
  valid_to timestamp without time zone,
  usage_limit integer,
  per_user_limit integer,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT promotions_pkey PRIMARY KEY (promotion_id)
);
CREATE TABLE public.reports (
  report_id integer NOT NULL DEFAULT nextval('reports_report_id_seq'::regclass),
  admin_id integer,
  station_id integer,
  report_type character varying,
  period character varying,
  data_summary text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (report_id),
  CONSTRAINT reports_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.roles (
  role_id integer NOT NULL DEFAULT nextval('roles_role_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  CONSTRAINT roles_pkey PRIMARY KEY (role_id)
);
CREATE TABLE public.service_packages (
  package_id integer NOT NULL DEFAULT nextval('service_packages_package_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  price numeric DEFAULT 0,
  duration_days integer DEFAULT 30,
  benefits jsonb,
  status character varying DEFAULT 'Active'::character varying,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT service_packages_pkey PRIMARY KEY (package_id)
);
CREATE TABLE public.stations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text,
  zip_code text,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  total_spots integer NOT NULL DEFAULT 0,
  available_spots integer NOT NULL DEFAULT 0,
  power_kw integer NOT NULL,
  connector_type text NOT NULL,
  price_per_kwh numeric NOT NULL,
  rating numeric DEFAULT 0.0 CHECK (rating >= 0::numeric AND rating <= 5::numeric),
  amenities ARRAY DEFAULT '{}'::text[],
  operating_hours text DEFAULT '24/7'::text,
  phone text,
  network text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'maintenance'::text, 'offline'::text])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  layout jsonb,
  CONSTRAINT stations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.system_settings (
  key character varying NOT NULL,
  value text,
  description text,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.user_packages (
  user_package_id integer NOT NULL DEFAULT nextval('user_packages_user_package_id_seq'::regclass),
  user_id integer,
  package_id integer,
  start_date timestamp without time zone DEFAULT now(),
  end_date timestamp without time zone,
  status character varying DEFAULT 'Active'::character varying,
  auto_renew boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  payment_id integer,
  CONSTRAINT user_packages_pkey PRIMARY KEY (user_package_id),
  CONSTRAINT user_packages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT user_packages_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.service_packages(package_id),
  CONSTRAINT user_packages_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(payment_id)
);
CREATE TABLE public.users (
  user_id integer NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
  name character varying NOT NULL,
  email character varying UNIQUE,
  phone character varying UNIQUE,
  role_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  password_hash character varying,
  station_id uuid,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id),
  CONSTRAINT fk_users_station FOREIGN KEY (station_id) REFERENCES public.stations(id)
);
CREATE TABLE public.vehicles (
  vehicle_id integer NOT NULL DEFAULT nextval('vehicles_vehicle_id_seq'::regclass),
  user_id integer,
  plate_number character varying NOT NULL,
  battery_capacity_kwh numeric,
  connector_type_id integer,
  created_at timestamp without time zone DEFAULT now(),
  make character varying,
  model character varying,
  year integer,
  color character varying,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT vehicles_pkey PRIMARY KEY (vehicle_id),
  CONSTRAINT vehicles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT vehicles_connector_type_id_fkey FOREIGN KEY (connector_type_id) REFERENCES public.connector_types(connector_type_id)
);