import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 bg-background border-t border-border">
      <div className="container flex items-center justify-between max-w-6xl px-4 mx-auto text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Vynixel. All rights reserved.</p>
        <div className="flex space-x-4">
          <a href="#" className="transition-colors hover:text-foreground">Terms</a>
          <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
