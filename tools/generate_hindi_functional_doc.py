"""
Generate: docs/functional-guide-hindi.docx
Uses win32com (Word) for proper heading styles, fonts, and formatting.
"""

import os, win32com.client

OUTPUT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "docs", "functional-guide-hindi.docx")
)
FONT = "Nirmala UI"


def main():
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    doc = word.Documents.Add()
    sel = word.Selection

    # Apply Nirmala UI to Normal style so all text inherits it
    doc.Styles("Normal").Font.Name = FONT
    doc.Styles("Normal").Font.Size = 12

    for hstyle in ("Heading 1", "Heading 2", "Heading 3"):
        doc.Styles(hstyle).Font.Name = FONT

    # ── helpers ──────────────────────────────────────────────────────

    def h1(text):
        sel.Style = doc.Styles("Heading 1")
        sel.Font.Name = FONT
        sel.TypeText(text)
        sel.TypeParagraph()

    def h2(text):
        sel.Style = doc.Styles("Heading 2")
        sel.Font.Name = FONT
        sel.TypeText(text)
        sel.TypeParagraph()

    def p(text, bold=False, italic=False, indent=0, size=12, align=None):
        sel.Style = doc.Styles("Normal")
        sel.Font.Name   = FONT
        sel.Font.Size   = size
        sel.Font.Bold   = bold
        sel.Font.Italic = italic
        sel.ParagraphFormat.LeftIndent = indent
        if align is not None:
            sel.ParagraphFormat.Alignment = align
        sel.TypeText(text)
        sel.TypeParagraph()
        sel.Font.Bold   = False
        sel.Font.Italic = False
        sel.Font.Size   = 12
        sel.ParagraphFormat.LeftIndent = 0
        sel.ParagraphFormat.Alignment = 0

    def b(text):
        sel.Style = doc.Styles("Normal")
        sel.Font.Name  = FONT
        sel.Font.Size  = 12
        sel.Font.Bold  = False
        sel.ParagraphFormat.LeftIndent = 28
        sel.TypeText("•  " + text)
        sel.TypeParagraph()
        sel.ParagraphFormat.LeftIndent = 0

    def br():
        sel.Style = doc.Styles("Normal")
        sel.Font.Bold = False
        sel.Font.Size = 6
        sel.TypeParagraph()
        sel.Font.Size = 12

    def center(text, size=14, bold=False, italic=False):
        p(text, bold=bold, italic=italic, size=size, align=1)

    # ── COVER ────────────────────────────────────────────────────────
    br(); br()
    center("गृह सेवा प्लेटफ़ॉर्म", size=28, bold=True)
    br()
    center("सम्पूर्ण कार्यात्मक विवरण", size=18)
    br()
    center("ग्राहक, तकनीशियन एवं व्यवसाय मालिक — तीनों के लिए", size=13, italic=True)
    br(); br()

    # ── 1. परिचय ─────────────────────────────────────────────────────
    h1("1. यह प्लेटफ़ॉर्म क्या है?")
    p("यह एक ऐसा डिजिटल बाज़ार है जो घर पर ज़रूरी सेवाएं — जैसे AC सर्विस, "
      "प्लम्बिंग, इलेक्ट्रिकल काम, डीप क्लीनिंग और पेस्ट कंट्रोल — सीधे ग्राहक "
      "के घर तक पहुंचाता है। यह तीन अलग-अलग ऐप और डैशबोर्ड पर काम करता है:")
    b("ग्राहक ऐप (Android) — सेवा बुक करने के लिए")
    b("तकनीशियन ऐप (Android) — काम लेने और करने के लिए")
    b("मालिक डैशबोर्ड (वेब) — पूरा व्यवसाय चलाने के लिए")
    br()
    p("तीनों आपस में जुड़े हैं — ग्राहक जब बुकिंग करता है, तो सबसे नज़दीकी "
      "तकनीशियन को तुरंत नोटिफ़िकेशन मिलता है और मालिक को real-time में सब कुछ "
      "दिखता है।")
    br()

    # ── 2. ग्राहक ────────────────────────────────────────────────────
    h1("2. ग्राहक की पूरी यात्रा")
    p("नीचे एक आम ग्राहक का पूरा अनुभव दिया गया है — पहली बार ऐप खोलने से लेकर "
      "सेवा पूरी होने तक।")
    br()

    h2("2.1  पहला कदम — लॉगिन और पंजीकरण (एक बार)")
    p("जब ग्राहक पहली बार ऐप खोलता है, उसे सिर्फ़ एक बार लॉगिन करना होता है। "
      "उसके बाद अगली बार सीधे ऐप खुलता है — दोबारा OTP नहीं मांगा जाता।")
    br()
    p("लॉगिन के तीन आसान तरीके:", bold=True)
    b("Truecaller से — अगर Truecaller मोबाइल में है, तो एक tap में नाम और नंबर "
      "अपने आप भर जाते हैं। OTP टाइप करने की ज़रूरत नहीं।")
    b("Mobile OTP से — सामान्य SMS OTP, 8 सेकंड में आता है।")
    b("Google Account से — Gmail से एक tap में।")
    br()
    p("संवेदनशील काम (जैसे पेमेंट देखना, बुकिंग बदलना) के लिए fingerprint या "
      "face unlock माँगा जाता है — यह अतिरिक्त सुरक्षा के लिए है।")
    br()

    h2("2.2  दूसरा कदम — सेवा खोजना")
    p("ऐप खुलते ही ग्राहक को सुंदर फ़ोटो-फर्स्ट होम स्क्रीन दिखती है — हर सेवा "
      "की बड़ी, साफ़ तस्वीर। किसी सेवा पर tap करने पर पूरी जानकारी खुलती है:")
    b("सेवा में क्या-क्या शामिल है — पूरी सूची")
    b("निश्चित मूल्य — जो दिखे, वही लगे। कोई hidden charge नहीं।")
    b("संभावित अतिरिक्त काम और उनके दाम पहले से बताए जाते हैं "
      "(जैसे 'gas refill ज़रूरी हो तो Rs. 1,200 — आपकी मंज़ूरी के बाद')।")
    b("7-दिन की फिक्स गारंटी — काम दोबारा बिगड़े तो मुफ्त ठीक होगा।")
    br()

    h2("2.3  तीसरा कदम — तकनीशियन को जानना (Trust Dossier)")
    p("बुकिंग से पहले ग्राहक को नज़दीकी तकनीशियन की पूरी जानकारी दिखती है:")
    b("नाम, फोटो, rating (जैसे 4.8 star), कुल जॉब (जैसे 340 काम किए)")
    b("DigiLocker से verified Aadhaar — सरकार द्वारा मान्य असली पहचान")
    b("ITI / प्रमाण-पत्र की जानकारी")
    b("आपके इलाके में पिछले कितने काम किए (जैसे 'आपकी सोसायटी में 5 काम')")
    b("बोली जाने वाली भाषाएं (Hindi, English, Kannada...)")
    b("ग्राहकों की लिखित टिप्पणियां — सिर्फ़ stars नहीं, असली राय")
    br()
    p("Confidence Score:", bold=True)
    p("हर तकनीशियन का एक 'Confidence Score' होता है जो बताता है कि वो कितना "
      "भरोसेमंद है — जैसे '95% समय पर, आपके इलाके में top rated'।", indent=28)
    br()

    h2("2.4  चौथा कदम — बुकिंग करना")
    p("बुकिंग तीन आसान steps में होती है:")
    b("समय और दिन चुनें — calendar से slot select करें")
    b("पता दर्ज करें — Google Maps से autocomplete; एक बार save होने के बाद "
      "दोबारा टाइप नहीं करना पड़ता")
    b("Payment करें — UPI / Card / Net Banking (Razorpay के ज़रिए सुरक्षित)")
    br()
    p("Payment होते ही ग्राहक और तकनीशियन दोनों को confirmation मिलती है। "
      "मूल्य lock हो जाता है — अब ग्राहक की मंज़ूरी के बिना एक रुपया भी extra नहीं लग सकता।")
    br()

    h2("2.5  पांचवां कदम — तकनीशियन को track करना")
    p("बुकिंग के दिन, काम शुरू होने से पहले ही मोबाइल पर live updates आने लगती हैं:")
    b('"सुरेश आपकी तरफ़ निकल पड़े हैं — ETA 12 मिनट"')
    b('"सुरेश 3.2 km दूर हैं" — map पर real-time location')
    b('"सुरेश आपके दरवाज़े पर पहुंच गए हैं"')
    br()
    p("Zomato की delivery tracking जैसा अनुभव — कोई अंदाज़ा नहीं लगाना, "
      "सब कुछ live दिखता है।")
    br()

    h2("2.6  छठा कदम — सेवा के दौरान (live photo updates)")
    p("जब तकनीशियन काम कर रहा होता है, ग्राहक को real-time फ़ोटो updates मिलती हैं:")
    b('"indoor unit खोला — filter देखें [फ़ोटो]"')
    b('"chemical wash शुरू"')
    b('"काम पूरा — before/after फ़ोटो देखें"')
    br()
    p("Add-on की मंज़ूरी:", bold=True)
    p("अगर काम के दौरान कोई अतिरिक्त सेवा ज़रूरी लगे, तो तकनीशियन पहले ग्राहक को "
      "ऐप पर quote भेजता है। ग्राहक 'हाँ' या 'नहीं' कहता है — "
      "मंज़ूरी के बिना एक रुपया भी extra नहीं लगता।", indent=28)
    br()

    h2("2.7  सातवां कदम — काम पूरा होने के बाद")
    b("ग्राहक ऐप पर rating और लिखित review दे सकता है")
    b("Email पर एक सुंदर PDF रिपोर्ट आती है — क्या काम हुआ, "
      "कौन से parts लगे, अगली service कब होनी चाहिए")
    b("7-दिन की warranty तुरंत active हो जाती है")
    br()
    p("Rating Shield — गलत rating से बचाव:", bold=True)
    p("अगर ग्राहक 2 star या कम rating देने जाए, तो ऐप पहले पूछता है — "
      "'क्या आप मालिक को बताना चाहते हैं?' मालिक 2 घंटे में सम्पर्क करके "
      "समस्या ठीक कर सकता है। इससे business की reputation सुरक्षित रहती है।",
      indent=28)
    br()

    h2("2.8  अगर कुछ गलत हो जाए")
    p("No-Show Guarantee:", bold=True)
    p("अगर तकनीशियन तय समय पर नहीं आया, तो ग्राहक को automatically "
      "Rs. 500 credit मिलता है और नया तकनीशियन भेजा जाता है — बिना माँगे।",
      indent=28)
    br()
    p("Complaint Resolution:", bold=True)
    p("शिकायत दर्ज करने पर 24 घंटे के अंदर जवाब मिलता है। मालिक सीधे ग्राहक से "
      "बात कर सकता है और ज़रूरत पड़े तो re-service, refund या credit दे सकता है।",
      indent=28)
    br()

    # ── 3. तकनीशियन ──────────────────────────────────────────────────
    h1("3. तकनीशियन की पूरी यात्रा")
    p("यह ऐप उन तकनीशियनों के लिए है जो काम करना चाहते हैं और अच्छा कमाना चाहते हैं।")
    br()

    h2("3.1  पंजीकरण और KYC (पहचान की पुष्टि)")
    b("OTP से login करता है")
    b("DigiLocker (सरकार का app) से Aadhaar verify — "
      "Aadhaar नंबर कहीं save नहीं होता, सिर्फ़ पुष्टि होती है")
    b("PAN card की फ़ोटो से OCR के ज़रिए PAN verify होता है")
    b("Skill test पास करना होता है (phone या in-person)")
    br()
    p("KYC में आमतौर पर 2-3 दिन लगते हैं। पूरा होने के बाद पहला job offer आ सकता है।")
    br()

    h2("3.2  काम मिलना — Job Offer Card")
    p("जब कोई ग्राहक बुकिंग करता है, नज़दीकी और सबसे suitable तकनीशियन को "
      "फ़ोन पर एक पूरी जानकारी वाला notification मिलता है:")
    b("ग्राहक का नाम और इलाका")
    b("काम की पूरी details")
    b("दूरी और अनुमानित समय")
    b("कमाई पहले से बताई जाती है — जैसे 'इस job पर आपको Rs. 450 मिलेंगे'")
    b("'आपको यह job क्यों मिली' — पारदर्शिता के लिए बताया जाता है "
      "(जैसे 'आप 3rd nearest हैं और AC में 4.9 star rating है')")
    br()
    p("स्वीकार या मना करने की आज़ादी:", bold=True)
    p("तकनीशियन job मना कर सकता है — इससे उसकी ranking या भविष्य की कमाई पर "
      "कोई असर नहीं पड़ता। यह Karnataka Platform Workers Act 2025 के अनुसार है।",
      indent=28)
    br()

    h2("3.3  ग्राहक के पास जाना")
    b("Job accept करते ही Google Maps navigation खुल जाती है")
    b("ग्राहक को notification मिलता है कि तकनीशियन निकल पड़ा है")
    b("तकनीशियन का real-time location ग्राहक को दिखता है")
    br()

    h2("3.4  काम करते समय")
    p("Guided Photo Capture:", bold=True)
    p("ऐप तकनीशियन को step-by-step guide करता है — कब-कब फ़ोटो लेनी है। "
      "फ़ोटो automatically ग्राहक को दिखती हैं — transparency और trust के लिए।",
      indent=28)
    br()
    p("Price Quote भेजना:", bold=True)
    p("अगर अतिरिक्त काम हो, तकनीशियन ऐप से quote भेजता है। "
      "ग्राहक की मंज़ूरी आने के बाद ही काम होता है।", indent=28)
    br()
    p("Service Stages:", bold=True)
    p("हर चरण को mark करना होता है — 'पहुंचा', 'काम शुरू', 'काम पूरा'। "
      "ग्राहक और मालिक दोनों को real-time में पता रहता है।", indent=28)
    br()

    h2("3.5  कमाई और भुगतान")
    b("Earnings Dashboard — आज, इस हफ़्ते, इस महीने की कमाई real-time में दिखती है")
    b("Target progress — जैसे 'Rs. 35,000 target में से Rs. 18,000 हो गए'")
    b("Flexible Payout — weekly, next-day, या instant — तकनीशियन खुद चुनता है")
    b("Razorpay के ज़रिए directly bank account में transfer")
    br()
    p("Rating Transparency:", bold=True)
    p("तकनीशियन अपनी हर rating देख सकता है — सिर्फ़ stars नहीं, ग्राहक की लिखित "
      "टिप्पणी भी। Punctuality, Skill, Behaviour — तीनों के अलग scores। "
      "गलत rating पर evidence के साथ appeal कर सकता है।", indent=28)
    br()

    h2("3.6  महिला तकनीशियनों के लिए सुरक्षा")
    b("Women-Safe Filter — रात के समय या beauty bookings में महिला tech को सिर्फ़ "
      "verified और safe history वाले ग्राहकों के job मिलते हैं")
    b("Safety SOS Button — एक button दबाने पर मालिक को silent alert जाता है "
      "और तुरंत कार्रवाई होती है")
    b("Abusive Customer Shield — बुरे बर्ताव की एक-tap report; "
      "वो ग्राहक उस tech को दोबारा नहीं मिलेगा")
    br()

    # ── 4. मालिक ──────────────────────────────────────────────────────
    h1("4. मालिक का डैशबोर्ड — पूरा व्यवसाय एक जगह")
    p("मालिक को किसी बड़ी team की ज़रूरत नहीं। "
      "Computer के browser से सब कुछ manage होता है।")
    br()

    h2("4.1  Live Operations — अभी क्या चल रहा है")
    b("City map पर दिखता है कौन-से तकनीशियन कहाँ हैं, कितने active हैं")
    b("Real-time order feed — नई बुकिंग, assignment, काम शुरू, काम पूरा — सब live")
    b("आज के numbers — bookings, revenue, commission — एक नज़र में")
    br()

    h2("4.2  Order Management — हर बुकिंग की पूरी जानकारी")
    b("सभी orders की list — filter और search करने की सुविधा")
    b("किसी भी order को click करें — बुकिंग से payment और rating तक पूरी timeline")
    b("Override Controls — technician बदलना, refund देना, credit add करना, "
      "re-service schedule करना — सब एक जगह से")
    br()

    h2("4.3  Finance — पैसों का पूरा हिसाब")
    b("Daily P&L Dashboard — आज का revenue, commission, payout और net earning")
    b("Weekly Payout Queue — इस हफ़्ते कितने tech को कितना देना है, "
      "एक click में सभी को payment")
    b("Razorpay Route — ग्राहक के payment से commission automatically अलग होती है "
      "और tech को उसका हिस्सा directly bank में जाता है")
    br()

    h2("4.4  Technician Management")
    b("नए technician की onboarding और KYC status track करें")
    b("Commission Ladder — tech जितने ज़्यादा काम करे, commission बढ़ती जाती है "
      "(22% से 25% तक)")
    b("किसी tech को suspend या deactivate करने का पूरा audit record")
    br()

    h2("4.5  Complaint Management — शिकायत प्रबंधन")
    b("Complaints Inbox — हर शिकायत एक SLA timer के साथ (24 घंटे में जवाब ज़रूरी)")
    b("ग्राहक और tech दोनों की बात एक ही screen पर देखें")
    b("एक-click resolution — refund, credit, re-service, या tech को warning")
    br()

    h2("4.6  कानूनी अनुपालन — सब automatic")
    p("मालिक को manually कुछ calculate नहीं करना — सब system खुद करता है:")
    b("SSC Levy (Central Social Security Code 2025) — हर booking के revenue पर "
      "1-2% automatically calculate होती है और quarterly सरकार को remit होती है")
    b("Karnataka Platform Workers Act — तकनीशियन का right-to-refuse built-in है; "
      "कोई भी job बिना penalty के मना कर सकता है")
    b("GST e-Invoicing — हर paid booking की GST-compliant invoice automatically बनती है")
    b("Immutable Audit Log — हर action permanently record — legal protection के लिए")
    br()

    # ── 5. अंतर ───────────────────────────────────────────────────────
    h1("5. हम बाकी platforms से अलग क्यों हैं?")

    h2("5.1  ग्राहक के लिए")
    b("Fixed price — जो दिखे वही लगे, कभी कोई shock नहीं")
    b("Zomato-जैसा live tracking — तकनीशियन कहाँ है, real-time में पता")
    b("Photo proof — हर काम का before/after documented")
    b("7-दिन warranty — काम बिगड़े तो मुफ्त ठीक")
    b("Rs. 500 no-show guarantee — tech न आए तो automatically credit")
    b("Airbnb-जैसा Trust Dossier — हर tech की पूरी verified history")
    br()

    h2("5.2  तकनीशियन के लिए")
    b("22-25% commission — Urban Company के 28% से कम; tech को ज़्यादा मिलता है")
    b("Job मना करने की आज़ादी — बिना किसी penalty के")
    b("कमाई पहले से पता — job accept करने से पहले ही")
    b("पारदर्शी dispatch — 'आपको यह job क्यों मिली' हमेशा बताया जाता है")
    b("Flexible payout — जब चाहें पैसे निकालें")
    br()

    h2("5.3  मालिक के लिए")
    b("एक व्यक्ति पूरा व्यवसाय चला सकता है — बड़ी team की ज़रूरत नहीं")
    b("Rs. 0 monthly infrastructure cost — pilot scale पर")
    b("सब कुछ real-time — कोई blindspot नहीं")
    b("Legal compliance automatic — SSC, Karnataka Act, GST सब built-in")
    br()

    # ── 6. End-to-end flow ────────────────────────────────────────────
    h1("6. एक बुकिंग का पूरा flow — शुरू से अंत तक")
    p("नीचे एक booking का सरल flow है जो तीनों parties को connect करता है:")
    br()

    steps = [
        ("कदम 1:",  "ग्राहक ऐप खोलता है  →  Truecaller / OTP से login (सिर्फ़ पहली बार)"),
        ("कदम 2:",  "ग्राहक सेवा चुनता है  →  Trust Dossier देखता है  →  3 tap में booking + payment"),
        ("कदम 3:",  "System nearest tech को find करता है  →  Tech के फ़ोन पर Job Offer Card "
                    "(earnings preview + reason सहित)"),
        ("कदम 4:",  "Tech job accept करता है  →  Google Maps navigation शुरू  →  ग्राहक को notification"),
        ("कदम 5:",  "ग्राहक को live location updates मिलती हैं  →  'Tech पहुंच गए'"),
        ("कदम 6:",  "Tech काम शुरू करता है  →  guided photos लेता है  →  ग्राहक को real-time updates"),
        ("कदम 7:",  "अगर add-on हो  →  Tech quote भेजता है  →  ग्राहक approve / reject करता है"),
        ("कदम 8:",  "काम पूरा  →  ग्राहक payment करता है  →  Razorpay auto-split: "
                    "commission मालिक को, बाकी tech के bank में directly"),
        ("कदम 9:",  "दोनों rating देते हैं  →  ग्राहक को PDF service report email पर"),
        ("कदम 10:", "मालिक के dashboard पर पूरी timeline, payment और rating visible; "
                    "quarterly SSC levy automatically calculate"),
    ]
    for label, text in steps:
        p(label, bold=True)
        p(text, indent=28)
        br()

    # ── 7. Roadmap ────────────────────────────────────────────────────
    h1("7. आगे का रोडमैप")
    p("यह MVP (पहला version) है — पहले phase में 5 categories "
      "(AC, Plumbing, Electrical, Deep Cleaning, Pest Control) और एक city pilot।")
    br()
    p("आगे के phases में:", bold=True)
    b("WhatsApp से booking")
    b("Hindi / Tamil / Telugu / Kannada में पूरा ऐप")
    b("Subscription plans (monthly/annual)")
    b("5+ cities")
    b("iOS app")
    b("Society / B2B contracts (RWA, corporates)")
    br()
    p("यह document MVP की सभी मुख्य features को cover करता है। "
      "किसी भी feature के बारे में विस्तार से जानना हो तो बताएं।")

    # ── Save ──────────────────────────────────────────────────────────
    doc.SaveAs(OUTPUT, FileFormat=16)
    doc.Close(False)
    word.Quit()
    size = os.path.getsize(OUTPUT)
    print(f"Written: {OUTPUT}  ({size:,} bytes)")


if __name__ == "__main__":
    main()
