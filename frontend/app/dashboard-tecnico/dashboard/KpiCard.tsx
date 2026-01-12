import { ReactNode } from "react";
import styles from "./KpiCard.module.css";

type Props = {
  title: string;
  value: string | number;
  icon: ReactNode;
};

export default function KpiCard({ title, value, icon }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>{icon}</div>

      <div className={styles.info}>
        <span className={styles.title}>{title}</span>
        <span className={styles.value}>{value}</span>
      </div>
    </div>
  );
}
