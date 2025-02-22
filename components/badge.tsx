interface BadgeProps {
  text: string;
  color?: string; 
}

const Badge: React.FC<BadgeProps> = ({ text, color = "green" }) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-white`}
      style={{ backgroundColor: color }}
    >
      {text}
    </span>
  );
};

export default Badge;
