"""CyberSense — локальный сервер для статического сайта.

По roadmap (M2) сайт работает без backend: весь контент лежит в site/js/data.js,
а прогресс сохраняется в браузере (localStorage). Этот файл только раздаёт папку
site/, чтобы удобно открыть сайт локально. Тот же сайт можно выложить на любой
статический хостинг (например, GitHub Pages) без Python.

Запуск:  python app.py   ->   http://127.0.0.1:5000
"""
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder="site", static_url_path="")


@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(debug=True)
