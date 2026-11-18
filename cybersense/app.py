"""CyberSense - interactive cybersecurity training prototype (Flask backend).

University project prototype:
  * all exercise data is hardcoded below (EXERCISES list)
  * progress is stored in the browser session cookie (no database)
  * all brands, people, numbers and passwords are fictional

Run:  python app.py   ->   open http://127.0.0.1:5000
"""
from flask import Flask, jsonify, render_template, request, session

app = Flask(__name__)
app.secret_key = "cybersense-demo-key"  # fine for a local prototype only

POINTS_PER_EXERCISE = 20

# ---------------------------------------------------------------------------
# Exercise data
#   scene    -> what the simulated interface shows (rendered by exercise.js)
#   options  -> answer choices; each has "feedback" explaining that choice
#   correct  -> the correct option text
#   signs    -> warning signs / key lessons shown after answering
# ---------------------------------------------------------------------------
EXERCISES = [
    {
        "id": 1,
        "title": "Phishing Email",
        "topic": "Email",
        "icon": "icon-email.svg",
        "difficulty": "Easy",
        "summary": "Spot the warning signs in an email that asks you to verify your account.",
        "scenario": "You receive this email in your inbox on a Monday morning. "
                    "Read it carefully. Is it a legitimate message or a phishing attempt?",
        "question": "Is this email safe or phishing?",
        "scene": {
            "type": "email",
            "logo": "payflow-logo.svg",
            "sender_name": "PayFlow Security Team",
            "sender_email": "security@payf1ow-support.com",
            "to": "you@student-mail.example",
            "date": "Mon, 08:14",
            "subject": "Action required: your account has been limited",
            "body": [
                "Dear Valued Customer,",
                "We have detected unusual sign-in activity on your PayFlow account. "
                "For your protection, your account has been temporarily limited.",
                "To restore full access you must verify your identity within 24 hours. "
                "If you do not verify, your account will be permanently closed and "
                "your balance will be frozen.",
            ],
            "button_text": "Verify my account",
            "button_url": "http://payf1ow-support.com/login-verify.php",
            "attachment": "Account_Verification_Form.zip",
            "signature": "PayFlow Customer Protection Departament",
        },
        "options": [
            {"text": "Safe",
             "feedback": "This email is not safe. Clicking the button would take you to a fake "
                         "login page, and the .zip attachment could contain malware."},
            {"text": "Phishing",
             "feedback": "Right. This is a phishing email trying to steal your login details."},
        ],
        "correct": "Phishing",
        "explanation": "Phishing emails copy the look of a real company but contain small "
                       "mistakes and push you to act quickly. Never log in through a link in "
                       "an email: open the official app or type the address yourself.",
        "signs": [
            "Sender domain is misspelled: payf1ow-support.com uses the number 1 instead of the letter l.",
            "Generic greeting (\"Dear Valued Customer\") instead of your name.",
            "Threat and urgency: \"within 24 hours\" or the account will be closed.",
            "The button leads to an unofficial http:// address, not the company's real website.",
            "Unexpected .zip attachment - a common way to deliver malware.",
            "Spelling mistake in the signature (\"Departament\").",
        ],
    },
    {
        "id": 2,
        "title": "Suspicious Website",
        "topic": "Websites",
        "icon": "icon-website.svg",
        "difficulty": "Medium",
        "summary": "Decide whether a bank login page is real or a fraudulent copy.",
        "scenario": "You clicked a link in a text message that said your bank card was "
                    "blocked. This login page opened in your browser. Look at the address "
                    "bar and the page content.",
        "question": "Is this website legitimate or fraudulent?",
        "scene": {
            "type": "website",
            "logo": "northstar-logo.svg",
            "secure": False,
            "url": "http://northstar-bank.secure-login-verify.com/signin",
            "tab_title": "NorthStar Bank - Sign In",
            "banner": "Your card has been BLOCKED. Sign in within 10:00 minutes to unblock it.",
            "heading": "Sign in to Online Banking",
            "fields": [
                {"label": "Customer ID", "placeholder": "e.g. 12345678"},
                {"label": "Password", "placeholder": "Password"},
                {"label": "Card number", "placeholder": "16-digit card number"},
                {"label": "Card PIN", "placeholder": "4-digit PIN"},
            ],
            "button": "Unblock my card",
            "footer": "© NorthStar Bank. All rigths reserved.",
        },
        "options": [
            {"text": "Legitimate",
             "feedback": "This page is fake. Anything typed here goes straight to the scammers, "
                         "who can then empty your account."},
            {"text": "Fraudulent",
             "feedback": "Correct. This is a fraudulent copy of a bank login page."},
        ],
        "correct": "Fraudulent",
        "explanation": "Fake websites copy logos and colours perfectly, so judge them by the "
                       "address and by what they ask for. The real domain is the part just "
                       "before the first single slash: here it is secure-login-verify.com, "
                       "not the bank.",
        "signs": [
            "The real domain is secure-login-verify.com - \"northstar-bank\" is only a subdomain added to fool you.",
            "Browser shows \"Not secure\" (http:// with no padlock).",
            "It asks for your card PIN. A real bank never asks for your PIN on a website.",
            "Countdown timer and capital letters create panic.",
            "Typo in the footer (\"rigths\").",
            "You reached the page from a link in an unexpected text message.",
        ],
    },
    {
        "id": 3,
        "title": "OTP & SMS Scam",
        "topic": "Messaging",
        "icon": "icon-sms.svg",
        "difficulty": "Medium",
        "summary": "Someone claiming to be your bank asks for the code you just received.",
        "scenario": "Your phone shows a chat from a number claiming to be your bank's "
                    "security team. A moment later you receive a real one-time code (OTP) "
                    "by SMS. What do you do?",
        "question": "What would you do?",
        "scene": {
            "type": "sms",
            "avatar": "avatar-unknown.svg",
            "contact": "NorthStar Bank Support",
            "number": "+44 7700 900461",
            "time": "21:47",
            "messages": [
                {"from": "them", "text": "Hello, this is the NorthStar Bank fraud team. "
                                         "We blocked a suspicious payment of £480.00 to "
                                         "an online store from your card."},
                {"from": "them", "text": "To cancel this payment and protect your money "
                                         "we need to confirm it is you. We have just sent "
                                         "you a 6-digit verification code."},
                {"from": "system", "text": "SMS from NorthStar: Your code is 482913. It "
                                           "approves a payment of £480.00. Never share this "
                                           "code with anyone, including bank staff."},
                {"from": "them", "text": "Please reply with the code quickly, the payment "
                                         "will go through in 5 minutes!!"},
            ],
        },
        "options": [
            {"text": "Reply with the code so they can cancel the payment",
             "feedback": "Consequence: the \"code\" actually approves the payment. The scammer "
                         "uses it to take the £480, and may ask for more codes to take more money."},
            {"text": "Ignore the chat and call the bank using the number on the back of your card",
             "feedback": "Correct. Calling the official number lets you check what is really "
                         "happening. Your money stays safe because the scammer never gets the code."},
            {"text": "Reply asking them to call you so you can talk to a real person",
             "feedback": "Consequence: you confirm your number is active and the scammer calls "
                         "you, using a confident voice and more pressure to get the code. "
                         "Talking to them is still risky."},
        ],
        "correct": "Ignore the chat and call the bank using the number on the back of your card",
        "explanation": "A one-time code (OTP) is like a signature: whoever has it can log in or "
                       "approve payments as you. Banks never ask you to read or forward a code. "
                       "If someone asks for it, it is a scam - end the conversation and contact "
                       "the bank yourself.",
        "signs": [
            "The SMS with the code itself says: never share this code with anyone.",
            "The code text mentions approving a payment - the opposite of what the chat claims.",
            "The \"bank\" writes from an ordinary mobile number.",
            "Urgency: \"the payment will go through in 5 minutes!!\"",
            "Real bank staff already have access to your account and do not need your code.",
        ],
    },
    {
        "id": 4,
        "title": "Fake Online Marketplace",
        "topic": "Shopping",
        "icon": "icon-shop.svg",
        "difficulty": "Easy",
        "summary": "A pair of premium headphones for 94% off. Too good to be true?",
        "scenario": "While scrolling social media you see an advert for an incredible deal "
                    "and open the product page below. Look at the price, seller, reviews and "
                    "payment instructions.",
        "question": "Would you trust this offer?",
        "scene": {
            "type": "shop",
            "store": "MegaDealz Outlet",
            "url": "https://megadealz-outlet.shop/item/soundmax-pro",
            "image": "product-headphones.svg",
            "product": "SoundMax Pro Wireless Noise-Cancelling Headphones",
            "price": "£19.99",
            "old_price": "£349.99",
            "discount": "-94%",
            "stock": "Only 2 left! Offer ends in 09:59",
            "seller": {
                "name": "BestDealz_Official_UK",
                "avatar": "avatar-seller.svg",
                "joined": "Joined 3 days ago",
                "sales": "0 completed sales",
                "rating": "5.0 (6 reviews)",
            },
            "reviews": [
                {"name": "Jhon S.", "stars": 5, "date": "Today", "text": "Great product!!! Very good seller fast delivery."},
                {"name": "Mary K.", "stars": 5, "date": "Today", "text": "Great product!!! Recommend 100% seller."},
                {"name": "Alex P.", "stars": 5, "date": "Today", "text": "Very good. Best price ever. Buy now."},
            ],
            "payment": [
                "Payment by bank transfer or gift card ONLY.",
                "For faster shipping, send gift card codes to the seller on WhatsApp.",
                "Card payments and PayPal are not available for this offer.",
                "All sales are final. No refunds or returns.",
            ],
        },
        "options": [
            {"text": "Trust",
             "feedback": "Risky choice. You would most likely lose your money and never receive "
                         "the headphones. Bank transfers and gift cards are almost impossible to "
                         "get back."},
            {"text": "Don't Trust",
             "feedback": "Correct. This offer has many signs of a fake online store."},
        ],
        "correct": "Don't Trust",
        "explanation": "Fake shops attract buyers with unrealistic prices and then ask for "
                       "payment methods that cannot be reversed. Use payment methods with buyer "
                       "protection (credit card, trusted platforms) and check the seller's "
                       "history before buying.",
        "signs": [
            "Unrealistic discount: 94% off a £350 product.",
            "Countdown timer and \"only 2 left\" to rush your decision.",
            "Seller joined 3 days ago with 0 completed sales but perfect reviews.",
            "Reviews are posted the same day, with repeated wording and spelling mistakes.",
            "Only bank transfer or gift cards accepted - no buyer protection.",
            "Asked to move the conversation to WhatsApp and \"no refunds\".",
        ],
    },
    {
        "id": 5,
        "title": "Password Security",
        "topic": "Passwords",
        "icon": "icon-password.svg",
        "difficulty": "Easy",
        "summary": "Choose the strongest password and learn what makes a password secure.",
        "scenario": "You are creating a new account for your university portal. The system "
                    "suggests the passwords below (all fictional examples). Which one is the "
                    "strongest?",
        "question": "Which password is the strongest?",
        "scene": {
            "type": "passwords",
            "intro": "Choose the strongest password for your new account:",
        },
        "options": [
            {"text": "Summer2025!",
             "feedback": "Weak - 11 characters. A season + year + \"!\" is one of the most "
                         "common patterns and is tried early by password-cracking tools."},
            {"text": "qwerty123456",
             "feedback": "Very weak - 12 characters, but it is just keyboard order and "
                         "counting. It appears in every list of leaked passwords."},
            {"text": "P@ssw0rd",
             "feedback": "Very weak - 8 characters. Swapping letters for symbols (@ for a, 0 "
                         "for o) is well known to attackers and does not help."},
            {"text": "maple-river-candle-73-orbit",
             "feedback": "Strong - 27 characters. Several random, unrelated words plus a number "
                         "make it long, unpredictable and still easy to remember."},
        ],
        "correct": "maple-river-candle-73-orbit",
        "explanation": "Length matters more than complexity. A long passphrase of random words "
                       "is far harder to guess than a short password with symbols. Use a "
                       "different password for every account and store them in a password "
                       "manager.",
        "signs": [
            "Length: aim for at least 14-16 characters.",
            "Unpredictability: avoid names, dates, seasons, keyboard patterns and common words.",
            "Simple substitutions (a -> @, o -> 0) are well known and add little strength.",
            "Never reuse the same password on different websites.",
            "Turn on two-factor authentication (2FA) wherever possible.",
        ],
    },
]


def find_exercise(ex_id):
    return next((e for e in EXERCISES if e["id"] == ex_id), None)


def public_view(ex):
    """Exercise data for the browser: everything except the answers."""
    hidden = {"correct", "explanation", "signs"}
    data = {k: v for k, v in ex.items() if k not in hidden}
    data["options"] = [o["text"] for o in ex["options"]]
    data["total"] = len(EXERCISES)
    return data


def get_answers():
    """Session progress: {"1": True, "3": False, ...} (key = exercise id)."""
    return session.setdefault("answers", {})


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------
@app.get("/")
def home():
    return render_template("index.html")


@app.get("/exercises")
def exercises_page():
    return render_template("exercises.html")


@app.get("/exercise/<int:ex_id>")
def exercise_page(ex_id):
    return render_template("exercise.html")


@app.get("/progress")
def progress_page():
    return render_template("progress.html")


# ---------------------------------------------------------------------------
# API (JSON)
# ---------------------------------------------------------------------------
@app.get("/api/exercises")
def api_exercises():
    answers = get_answers()
    return jsonify([
        {"id": e["id"], "title": e["title"], "topic": e["topic"], "icon": e["icon"],
         "difficulty": e["difficulty"], "summary": e["summary"],
         "completed": str(e["id"]) in answers}
        for e in EXERCISES
    ])


@app.get("/api/exercises/<int:ex_id>")
def api_exercise(ex_id):
    ex = find_exercise(ex_id)
    if not ex:
        return jsonify({"error": "Exercise not found"}), 404
    return jsonify(public_view(ex))


@app.post("/api/answer")
def api_answer():
    data = request.get_json(silent=True) or {}
    ex = find_exercise(data.get("exercise_id"))
    if not ex:
        return jsonify({"error": "Exercise not found"}), 404

    chosen = data.get("answer")
    valid = [o["text"] for o in ex["options"]]
    if chosen not in valid:
        return jsonify({"error": "Please choose one of the options"}), 400

    is_correct = chosen == ex["correct"]
    answers = get_answers()
    answers[str(ex["id"])] = is_correct
    session.modified = True

    return jsonify({
        "correct": is_correct,
        "your_answer": chosen,
        "correct_answer": ex["correct"],
        "explanation": ex["explanation"],
        "signs": ex["signs"],
        "options_feedback": [
            {"option": o["text"], "is_correct": o["text"] == ex["correct"],
             "feedback": o["feedback"]}
            for o in ex["options"]
        ],
    })


@app.get("/api/progress")
def api_progress():
    answers = get_answers()
    total = len(EXERCISES)
    completed = len(answers)
    correct = sum(1 for v in answers.values() if v)
    return jsonify({
        "total": total,
        "completed": completed,
        "correct": correct,
        "score": correct * POINTS_PER_EXERCISE,
        "max_score": total * POINTS_PER_EXERCISE,
        "percent": round(completed / total * 100),
        "details": [
            {"id": e["id"], "title": e["title"], "icon": e["icon"],
             "status": ("correct" if answers[str(e["id"])] else "incorrect")
                       if str(e["id"]) in answers else "not_started"}
            for e in EXERCISES
        ],
    })


@app.post("/api/progress/reset")
def api_reset():
    session.pop("answers", None)
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(debug=True)
