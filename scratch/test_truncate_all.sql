BEGIN;
CREATE TABLE t_dept (id int PRIMARY KEY);
CREATE TABLE t_user (id int PRIMARY KEY, dept_id int REFERENCES t_dept(id));
INSERT INTO t_dept VALUES (1);
INSERT INTO t_user VALUES (1, NULL);

-- Drop constraints
ALTER TABLE t_user DROP CONSTRAINT t_user_dept_id_fkey;
TRUNCATE t_dept; -- No cascade needed because FK is dropped
ALTER TABLE t_user ADD CONSTRAINT t_user_dept_id_fkey FOREIGN KEY (dept_id) REFERENCES t_dept(id);
SELECT * FROM t_user;
ROLLBACK;
