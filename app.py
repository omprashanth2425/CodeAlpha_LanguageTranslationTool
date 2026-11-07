import io
import streamlit as st
from deep_translator import GoogleTranslator
from gtts import gTTS

st.set_page_config(page_title="Language Translation Tool", page_icon="🌐")
st.title("🌐 Language Translation Tool")

langs = GoogleTranslator().get_supported_languages(as_dict=True)
names = list(langs.keys())

text = st.text_area("Enter text to translate", height=150)
c1, c2 = st.columns(2)
src = c1.selectbox("From", ["auto"] + names)
tgt = c2.selectbox("To", names, index=names.index("hindi"))

if st.button("Translate"):
    if not text.strip():
        st.warning("Please enter some text.")
    else:
        try:
            s = "auto" if src == "auto" else langs[src]
            out = GoogleTranslator(source=s, target=langs[tgt]).translate(text)
            st.subheader("Translated text")
            st.success(out)
            st.caption("Copy (use the icon on the right):")
            st.code(out, language=None)
            try:
                buf = io.BytesIO()
                gTTS(out, lang=langs[tgt]).write_to_fp(buf)
                st.audio(buf.getvalue(), format="audio/mp3")
            except Exception:
                st.caption("Speech not available for this language.")
        except Exception as e:
            st.error(f"Translation failed: {e}")
            