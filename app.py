from flask import Flask
from routes import routes


def create_app():
    app = Flask(__name__, static_folder="static", template_folder="templates")
    app.register_blueprint(routes, url_prefix="/")

    @app.after_request
    def add_headers(resp):
        resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        resp.headers.setdefault(
            "Permissions-Policy", "geolocation=(), microphone=(), camera=()"
        )
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("X-Frame-Options", "DENY")
        if resp.mimetype and resp.mimetype.startswith("text/html"):
            resp.cache_control.public = True
            resp.cache_control.max_age = 60
        else:
            resp.cache_control.public = True
            resp.cache_control.max_age = 86400
        return resp

    return app


# Tạo app instance ở global scope
app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
