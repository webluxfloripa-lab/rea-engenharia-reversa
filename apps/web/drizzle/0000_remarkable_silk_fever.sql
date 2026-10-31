CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`project` text,
	`action` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_owner` ON `audit_events` (`owner`,`created`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`owner` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`payload` text NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `projects_owner` ON `projects` (`owner`);--> statement-breakpoint
CREATE TABLE `revisions` (
	`project` text NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL,
	`label` text NOT NULL,
	`created` text NOT NULL,
	PRIMARY KEY(`project`, `version`),
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TRIGGER project_initial_revision AFTER INSERT ON projects BEGIN
 INSERT INTO revisions(project,version,payload,label,created) VALUES(NEW.id,NEW.version,NEW.payload,json_extract(NEW.payload,'$.label'),NEW.updated);
END;
--> statement-breakpoint
CREATE TRIGGER project_new_revision AFTER UPDATE OF version ON projects BEGIN
 INSERT INTO revisions(project,version,payload,label,created) VALUES(NEW.id,NEW.version,NEW.payload,json_extract(NEW.payload,'$.label'),NEW.updated);
END;
