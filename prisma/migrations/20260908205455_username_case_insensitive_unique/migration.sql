-- Case-insensitive uniqueness for usernames (sign-in already matches
-- case-insensitively; this closes the gap so two accounts can't exist
-- that only differ by case).
CREATE UNIQUE INDEX "User_username_lower_key" ON "User" ((LOWER(username)));
