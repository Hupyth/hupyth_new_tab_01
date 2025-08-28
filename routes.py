from datetime import datetime
from flask import (
    Blueprint,
    render_template,
    redirect,
    url_for,
    request,
    jsonify,
    current_app,
    send_from_directory,
)
import re, time, json, pathlib, os

routes = Blueprint("routes", __name__)


@routes.route("/")
@routes.route("/home/")
@routes.route("/home")
def home():
    return render_template("index.html")


@routes.route("/index.html")
@routes.route("/templates/index.html")
def return_home():
    return redirect(url_for("routes.home"))


@routes.route("/about/")
@routes.route("/about")
def about():
    return render_template("about.html")


@routes.route("/about.html")
@routes.route("/templates/about.html")
def return_about():
    return redirect(url_for("routes.about"))


@routes.route("/contact/")
@routes.route("/contact")
def contact():
    try:
        return render_template("contact.html")
    except:
        return send_from_directory(current_app.root_path, "contact.html")


@routes.route("/contact.html")
@routes.route("/templates/contact.html")
def return_contact():
    return redirect(url_for("routes.contact"))


@routes.route("/index.js")
def serve_index_js():
    return send_from_directory(current_app.static_folder, "index.js")


@routes.route("/static/index.js")
def return_serve_index_js():
    return redirect(url_for("routes.serve_index_js"))


@routes.route("/index.css")
def serve_index_css():
    return send_from_directory(current_app.static_folder, "index.css")


@routes.route("/static/index.css")
def return_serve_index_css():
    return redirect(url_for("routes.serve_index_css"))


@routes.route("/detect-devtools.js")
def serve_detect_devtools_js():
    return send_from_directory(current_app.static_folder, "detect-devtools.js")


@routes.route("/static/detect-devtools.js")
def return_serve_detect_devtools_js():
    return redirect(url_for("routes.serve_detect_devtools_js"))


@routes.route("/contact.js")
def serve_contact_js():
    return send_from_directory(current_app.static_folder, "contact.js")


@routes.route("/static/contact.js")
def return_serve_contact_js():
    return redirect(url_for("routes.serve_contact_js"))


@routes.route("/base.js")
def serve_base_js():
    return send_from_directory(current_app.static_folder, "base.js")


@routes.route("/static/base.js")
def return_serve_base_js():
    return redirect(url_for("routes.serve_base_js"))


@routes.route("/logo.png")
def serve_icon_png():
    return send_from_directory(
        os.path.join(current_app.static_folder, "images"), "icon.png"
    )


@routes.route("/static/images/icon.png")
def return_serve_icon_png():
    return redirect(url_for("routes.serve_icon_png"))


# Serve error pages
@routes.route("/500")
@routes.route("/500/")
def serve_500_html():
    return render_template("500.html")


@routes.route("/500.html")
@routes.route("/templates/500.html")
def return_serve_500_html():
    return redirect(url_for("routes.serve_500_html"))


@routes.route("404")
@routes.route("/404/")
def serve_404_html():
    return render_template("404.html")


@routes.route("/404.html")
@routes.route("/templates/404.html")
def return_serve_404_html():
    return redirect(url_for("routes.serve_404_html"))


# Meta
@routes.route("/robots.txt")
def robots():
    return (
        "User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n",
        200,
        {"Content-Type": "text/plain; charset=utf-8"},
    )


@routes.route("/sitemap.xml")
def sitemap():
    base = request.host_url.rstrip("/")
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>{base}/</loc></url>
  <url><loc>{base}/home/</loc></url>
  <url><loc>{base}/about/</loc></url>
  <url><loc>{base}/contact/</loc></url>
</urlset>"""
    return (xml, 200, {"Content-Type": "application/xml; charset=utf-8"})


# API
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@routes.route("/api/health")
@routes.route("/api/health/")
def health():
    return jsonify(status="ok", ts=int(time.time()))


@routes.route("/api/contact", methods=["POST"])
@routes.route("/api/contact/", methods=["POST"])
def api_contact():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    message = (data.get("message") or "").strip()
    if not name or not EMAIL_RE.match(email) or not message:
        return jsonify(ok=False, err="invalid_input"), 400

    # Đường dẫn tuyệt đối tới thư mục data trong root của ứng dụng
    data_dir = pathlib.Path(current_app.root_path) / "data"
    data_dir.mkdir(exist_ok=True)
    store = data_dir / "contact_logs.jsonl"

    with store.open("a", encoding="utf-8") as f:
        f.write(
            json.dumps(
                {
                    "ts": int(time.time()),
                    "name": name,
                    "email": email,
                    "message": message,
                },
                ensure_ascii=False,
            )
            + "\n"
        )
    return jsonify(ok=True)


@routes.route("/api/save-search-history", methods=["POST"])
@routes.route("/api/save-search-history/", methods=["POST"])
def save_search_history():
    try:
        data = request.get_json()
        search_query = data.get("search_query", "").strip()

        if not search_query:
            return jsonify({"success": False, "error": "Empty search query"}), 400

        # Split the search query into individual keywords
        keywords = search_query.split()

        # Đảm bảo thư mục data tồn tại (sử dụng pathlib cho nhất quán)
        data_dir = pathlib.Path(current_app.root_path) / "data"
        data_dir.mkdir(exist_ok=True)
        search_file = data_dir / "search_history.jsonl"

        # Đọc dữ liệu hiện có
        existing_data = {}
        if search_file.exists():
            with search_file.open("r", encoding="utf-8") as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                        existing_data[entry["keyword"].lower()] = entry
                    except:
                        continue

        updated_entries = []
        new_entries = []

        # Tạo set để theo dõi các từ khóa đã xử lý, tránh trùng lặp
        processed_keywords = set()

        # Xử lý từng từ riêng lẻ
        for keyword in keywords:
            lower_keyword = keyword.lower()
            if lower_keyword in processed_keywords:
                continue  # Đã xử lý từ này rồi

            processed_keywords.add(lower_keyword)

            if lower_keyword in existing_data:
                # Cập nhật số lần tìm kiếm
                existing_data[lower_keyword]["count"] += 1
                existing_data[lower_keyword]["timestamp"] = datetime.now().isoformat()
                updated_entries.append(existing_data[lower_keyword])
            else:
                # Thêm từ khóa mới
                new_entry = {
                    "keyword": keyword,
                    "timestamp": datetime.now().isoformat(),
                    "count": 1,
                }
                existing_data[lower_keyword] = new_entry
                new_entries.append(new_entry)

        # Xử lý toàn bộ search query (chỉ nếu khác với các từ riêng lẻ)
        original_query_lower = search_query.lower()
        if original_query_lower not in processed_keywords:
            processed_keywords.add(original_query_lower)

            if original_query_lower in existing_data:
                # Cập nhật số lần tìm kiếm
                existing_data[original_query_lower]["count"] += 1
                existing_data[original_query_lower][
                    "timestamp"
                ] = datetime.now().isoformat()
                updated_entries.append(existing_data[original_query_lower])
            else:
                # Thêm từ khóa mới
                new_entry = {
                    "keyword": search_query,
                    "timestamp": datetime.now().isoformat(),
                    "count": 1,
                }
                existing_data[original_query_lower] = new_entry
                new_entries.append(new_entry)

        # Ghi lại toàn bộ dữ liệu vào file
        all_entries = list(existing_data.values())

        # Sắp xếp theo thời gian mới nhất
        all_entries.sort(key=lambda x: x["timestamp"], reverse=True)

        # Ghi toàn bộ dữ liệu vào file
        with search_file.open("w", encoding="utf-8") as f:
            for entry in all_entries:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")

        return jsonify(
            {
                "success": True,
                "added": len(new_entries),
                "updated": len(updated_entries),
                "total_keywords": len(all_entries),
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# Thêm route để xem lịch sử tìm kiếm
@routes.route("/api/search-history")
@routes.route("/api/search-history/")
def api_search_history():
    try:
        data_dir = pathlib.Path(current_app.root_path) / "data"
        search_file = data_dir / "search_history.jsonl"

        if not search_file.exists():
            return jsonify({"history": []})

        history = []
        with search_file.open("r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    history.append(
                        {
                            "keyword": entry["keyword"],
                            "count": entry["count"],
                            "timestamp": entry["timestamp"],
                        }
                    )
                except:
                    continue

        # Sắp xếp theo count giảm dần
        history.sort(key=lambda x: x["count"], reverse=True)

        return jsonify({"history": history})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Thêm route để lấy gợi ý tìm kiếm
@routes.route("/api/search-suggestions")
@routes.route("/api/search-suggestions/")
def search_suggestions():
    try:
        query = request.args.get("q", "").strip().lower()

        if not query:
            return jsonify({"suggestions": []})

        data_dir = pathlib.Path(current_app.root_path) / "data"
        search_file = data_dir / "search_history.jsonl"

        if not search_file.exists():
            return jsonify({"suggestions": []})

        suggestions = []
        with search_file.open("r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    keyword_lower = entry["keyword"].lower()

                    # Tìm các từ khóa chứa query (tìm kiếm phần tử con)
                    if query in keyword_lower:
                        suggestions.append(
                            {
                                "keyword": entry["keyword"],
                                "count": entry["count"],
                                "timestamp": entry["timestamp"],
                            }
                        )
                except:
                    continue

        # Sắp xếp theo độ phổ biến (count) và thời gian gần nhất
        suggestions.sort(key=lambda x: (-x["count"], x["timestamp"]), reverse=True)

        # Giới hạn số lượng gợi ý
        suggestions = suggestions[:10]

        return jsonify({"suggestions": suggestions})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Thêm route để xóa lịch sử tìm kiếm (tùy chọn)
@routes.route("/api/clear-search-history", methods=["POST"])
@routes.route("/api/clear-search-history/", methods=["POST"])
def clear_search_history():
    try:
        data_dir = pathlib.Path(current_app.root_path) / "data"
        search_file = data_dir / "search_history.jsonl"

        if search_file.exists():
            search_file.unlink()

        return jsonify({"success": True, "message": "Search history cleared"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@routes.route("/api/contact-logs")
@routes.route("/api/contact-logs/")
def api_contact_logs():
    try:
        data_dir = pathlib.Path(current_app.root_path) / "data"
        logs_file = data_dir / "contact_logs.jsonl"

        if not logs_file.exists():
            return jsonify({"logs": []})

        logs = []
        with logs_file.open("r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    logs.append(
                        {
                            "ts": entry["ts"],
                            "name": entry["name"],
                            "email": entry["email"],
                            "message": entry["message"],
                        }
                    )
                except:
                    continue

        return jsonify({"logs": logs})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Serve data files (chỉ cho mục đích debug, nên remove trong production)
@routes.route("/contact_logs.jsonl")
@routes.route("/data/contact_logs.jsonl")
def return_api_contact_logs():
    return redirect(url_for("routes.api_contact_logs"))


@routes.route("/search_history.jsonl")
@routes.route("/data/search_history.jsonl")
def return_api_search_history():
    return redirect(url_for("routes.api_search_history"))


# Errors
@routes.app_errorhandler(404)
def not_found(e):
    return redirect(url_for("routes.serve_404_html"))


@routes.app_errorhandler(500)
def server_error(e):
    return redirect(url_for("routes.serve_500_html"))
