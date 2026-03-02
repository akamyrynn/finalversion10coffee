"use client";

import { useActionState } from "react";
import Copy from "./_shared/Copy";
import { submitPriceListRequest, type PriceListState } from "@/lib/actions/price-list";
import styles from "./PriceListForm.module.css";

const initialState: PriceListState = { success: false };

export default function PriceListForm() {
  const [state, formAction, isPending] = useActionState(
    submitPriceListRequest,
    initialState,
  );

  return (
    <section className={styles.section} id="price-list-form">
      <div className={styles.container}>
        <Copy type="words" animateOnScroll>
          <h3>Получить прайс-лист</h3>
        </Copy>

        <Copy type="lines" animateOnScroll>
          <p className="md">
            Оставьте контакты и мы отправим актуальный прайс-лист
          </p>
        </Copy>

        {state.success ? (
          <p className={styles.success}>
            Спасибо! Прайс-лист будет отправлен на вашу почту.
          </p>
        ) : (
          <form action={formAction} className={styles.form}>
            <input
              type="text"
              name="name"
              placeholder="Ваше имя"
              required
              className={styles.input}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className={styles.input}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Телефон"
              required
              className={styles.input}
            />
            <input
              type="text"
              name="company"
              placeholder="Компания (необязательно)"
              className={styles.input}
            />
            {state.error && <p className={styles.error}>{state.error}</p>}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isPending}
            >
              {isPending ? "Отправка..." : "Отправить"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
