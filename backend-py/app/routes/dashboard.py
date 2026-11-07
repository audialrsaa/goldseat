from flask import Blueprint

from app.controllers.dashboard_controller import get_dashboard_stats

dashboard_bp = Blueprint("dashboard", __name__)

# GET /api/admin/dashboard
dashboard_bp.add_url_rule(
    "/admin/dashboard",
    view_func=get_dashboard_stats,
    methods=["GET"]
)

# daftarkan blueprint ini di app/__init__.py atau app/routes/__init__.py:
# app.register_blueprint(dashboard_bp, url_prefix="/api")