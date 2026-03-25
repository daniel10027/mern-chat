const ForumPost = require('../models/ForumPost');

// ── Get posts ─────────────────────────────────────────────────────────────────
exports.getPosts = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 10, sort = 'newest' } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (search) filter.$text = { $search: search };

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { views: -1 },
      likes: { 'likes.length': -1 },
    };

    const [posts, total] = await Promise.all([
      ForumPost.find(filter)
        .populate('author', 'name username avatar')
        .sort(sortMap[sort] || sortMap.newest)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .select('-comments'),
      ForumPost.countDocuments(filter),
    ]);

    res.json({ posts, total, pages: Math.ceil(total / limit), page: parseInt(page) });
  } catch (err) { next(err); }
};

// ── Get single post ───────────────────────────────────────────────────────────
exports.getPost = async (req, res, next) => {
  try {
    const post = await ForumPost.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'name username avatar')
      .populate('comments.author', 'name username avatar');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) { next(err); }
};

// ── Create post ───────────────────────────────────────────────────────────────
exports.createPost = async (req, res, next) => {
  try {
    const { title, content, category, tags } = req.body;
    const post = await ForumPost.create({
      title, content, category, tags,
      author: req.user._id,
    });
    const populated = await post.populate('author', 'name username avatar');
    res.status(201).json(populated);
  } catch (err) { next(err); }
};

// ── Update post ───────────────────────────────────────────────────────────────
exports.updatePost = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    const { title, content, category, tags } = req.body;
    if (title)    post.title    = title;
    if (content)  post.content  = content;
    if (category) post.category = category;
    if (tags)     post.tags     = tags;
    await post.save();
    res.json(post);
  } catch (err) { next(err); }
};

// ── Delete post ───────────────────────────────────────────────────────────────
exports.deletePost = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) { next(err); }
};

// ── Toggle like ───────────────────────────────────────────────────────────────
exports.toggleLike = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const idx = post.likes.indexOf(req.user._id);
    if (idx === -1) post.likes.push(req.user._id);
    else post.likes.splice(idx, 1);
    await post.save();
    res.json({ likes: post.likes.length, liked: idx === -1 });
  } catch (err) { next(err); }
};

// ── Add comment ───────────────────────────────────────────────────────────────
exports.addComment = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.closed) return res.status(400).json({ message: 'Post is closed for comments' });
    post.comments.push({ author: req.user._id, content: req.body.content });
    await post.save();
    await post.populate('comments.author', 'name username avatar');
    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json(newComment);
  } catch (err) { next(err); }
};

// ── Delete comment ────────────────────────────────────────────────────────────
exports.deleteComment = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    const comment = post?.comments.id(req.params.commentId);
    if (!post || !comment) return res.status(404).json({ message: 'Not found' });
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    comment.deleteOne();
    await post.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) { next(err); }
};
