interface BadgeProps {
  text: string;
  color?: string; 
}

const Badge: React.FC<BadgeProps> = ({ text, color = "green" }) => {
  return (
    <span
      className={`flex items-center justify-center px-5 py-3 rounded-full text-white shadow-lg`}
      style={{ 
        backgroundColor: `${color}80`,
        boxShadow: `0 10px 30px ${color}80`
      }}
    >
      {text}
    </span>
  );
};

export default Badge;

