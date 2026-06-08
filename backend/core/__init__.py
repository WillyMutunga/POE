import pymysql

pymysql.install_as_MySQLdb()

# Bypass Django database version checks for older MariaDB/MySQL in XAMPP
from django.db.backends.base.base import BaseDatabaseWrapper
BaseDatabaseWrapper.check_database_version_supported = lambda self: None

# Bypass Django MariaDB 10.5+ RETURNING feature requirement for older MariaDB versions
from django.db.backends.mysql.features import DatabaseFeatures
DatabaseFeatures.can_return_columns_from_insert = property(lambda self: False)
DatabaseFeatures.can_return_rows_from_bulk_insert = property(lambda self: False)
